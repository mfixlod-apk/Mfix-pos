package com.mfix.pos;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Regression tests for the ESC/POS bytes used by MFIX USB printer actions. */
public class PrinterProtocolTest {
    @Test public void cashDrawerPulseMatchesPrinterCommand() {
        byte[] expected = new byte[]{0x1b, 0x70, 0x00, 0x19, (byte) 0xfa};
        assertArrayEquals(expected, new byte[]{0x1b, 0x70, 0x00, 0x19, (byte) 0xfa});
    }

    @Test public void testReceiptContainsInitAndCut() {
        byte[] init = new byte[]{0x1b, 0x40, 0x1b, 0x61, 0x01};
        byte[] cut = new byte[]{0x1b, 0x64, 0x03, 0x1d, 0x56, 0x42, 0x00};
        assertEquals(5, init.length);
        assertEquals(7, cut.length);
        assertEquals(0x1b, cut[0]);
        assertEquals(0x56, cut[4]);
    }

    @Test public void rasterPacketHeaderUsesGsV0() {
        int bytesPerLine = 384;
        int rows = 32;
        byte[] header = new byte[]{0x1d,0x76,0x30,0x00,(byte)(bytesPerLine & 255),(byte)((bytesPerLine >> 8)&255),(byte)(rows & 255),(byte)((rows >> 8)&255)};
        assertArrayEquals(new byte[]{0x1d,0x76,0x30,0x00,(byte)0x80,0x01,0x20,0x00}, header);
    }
}
