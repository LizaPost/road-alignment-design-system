package geodesy.roadalignment;

import geodesy.roadalignment.importer.CsvTerrainPointReader;
import geodesy.roadalignment.model.TerrainPoint;
import org.junit.jupiter.api.Test;

import java.io.StringReader;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class CsvTerrainPointReaderTest {

    private final CsvTerrainPointReader reader = new CsvTerrainPointReader();

    @Test
    void shouldReadValidCsvCorrectly() throws Exception {

        String csv = """
                id,x,y,z
                P001,100.00,200.00,145.20
                P002,150.00,250.00,146.80
                P003,200.00,300.00,148.10
                """;
        List<TerrainPoint> points = reader.read(new StringReader(csv));

        assertEquals(3,points.size());
        assertEquals(new TerrainPoint("P001", 100.00, 200.00, 145.20), points.get(0));
        assertEquals(new TerrainPoint("P002", 150.00, 250.00, 146.80), points.get(1));
        assertEquals(new TerrainPoint("P003", 200.00, 300.00, 148.10), points.get(2));
    }

    @Test
    void shouldReturnEmptyListForEmptyCsv() throws Exception {

        String csv ="";

        List<TerrainPoint> points = reader.read(new StringReader(csv));

        assertTrue(points.isEmpty());
    }

    @Test
    void shouldSkipBlankLines() throws Exception {

        String csv = """
                id,x,y,z
                
                P001,100.00,200.00,145.20
                
                P002,150.00,250.00,146.80
                
                P003,200.00,300.00,148.10
                """;
        List<TerrainPoint> points = reader.read(new StringReader(csv));

        assertEquals(3,points.size());
        assertEquals("P001", points.get(0).id());
        assertEquals("P002", points.get(1).id());
        assertEquals("P003", points.get(2).id());
    }

    @Test
    void shouldRejectRowWithIncorrectNumberOfValues() {

        String csv = """ 
                id,x,y,z
                P001,100.00,200.00
                """;

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> reader.read(new StringReader(csv))
        );

        assertEquals("Each csv row must contain exactly 4 values: id, x, y, z.", exception.getMessage());
    }

    @Test
    void shouldReadDecimalCoordinatesCorrectly() throws Exception {

        String csv = """
                id,x,y,z
                P001,125.86,238.985,258.4631
                """;

        List<TerrainPoint> points = reader.read(new StringReader(csv));

        TerrainPoint point = points.get(0);

        assertEquals(125.86, point.x());
        assertEquals(238.985, point.y());
        assertEquals(258.4631, point.z());
    }

    @Test
    void shouldRejectInvalidNumber() {

        String csv = """
                id,x,y,z
                P001,254.85,fhjg,457.8215
                """;

        assertThrows(NumberFormatException.class, () -> reader.read(new StringReader(csv)));
    }

}
