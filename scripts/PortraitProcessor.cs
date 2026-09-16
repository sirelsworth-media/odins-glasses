using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PortraitProcessor
{
    private static bool IsBackground(byte blue, byte green, byte red)
    {
        int maximum = Math.Max(red, Math.Max(green, blue));
        int minimum = Math.Min(red, Math.Min(green, blue));
        int brightness = (red + green + blue) / 3;
        return brightness >= 205 && maximum - minimum <= 22;
    }

    public static void Convert(string sourcePath, string destinationPath)
    {
        using (var original = new Bitmap(sourcePath))
        using (var source = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source))
                graphics.DrawImageUnscaled(original, 0, 0);

            int width = source.Width;
            int height = source.Height;
            int pixelCount = width * height;
            var rectangle = new Rectangle(0, 0, width, height);
            var bitmapData = source.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = bitmapData.Stride;
            var pixels = new byte[stride * height];
            Marshal.Copy(bitmapData.Scan0, pixels, 0, pixels.Length);

            var visited = new byte[pixelCount];
            var queued = new byte[pixelCount];
            var queue = new Queue<int>(width * 4);

            Action<int> enqueue = index => {
                if (queued[index] == 0) { queued[index] = 1; queue.Enqueue(index); }
            };
            for (int x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
            for (int y = 1; y < height - 1; y++) { enqueue(y * width); enqueue(y * width + width - 1); }

            while (queue.Count > 0)
            {
                int index = queue.Dequeue();
                int x = index % width;
                int y = index / width;
                int offset = y * stride + x * 4;
                if (!IsBackground(pixels[offset], pixels[offset + 1], pixels[offset + 2])) continue;
                visited[index] = 1;
                if (x > 0) enqueue(index - 1);
                if (x + 1 < width) enqueue(index + 1);
                if (y > 0) enqueue(index - width);
                if (y + 1 < height) enqueue(index + width);
            }

            int left = width, top = height, right = -1, bottom = -1;
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int index = y * width + x;
                    int offset = y * stride + x * 4;
                    if (visited[index] != 0)
                    {
                        pixels[offset + 3] = 0;
                    }
                    else
                    {
                        pixels[offset + 3] = 255;
                        left = Math.Min(left, x); top = Math.Min(top, y);
                        right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                    }
                }
            }
            Marshal.Copy(pixels, 0, bitmapData.Scan0, pixels.Length);
            source.UnlockBits(bitmapData);

            if (right < left || bottom < top) throw new InvalidOperationException("No subject found: " + sourcePath);
            int cropWidth = right - left + 1;
            int cropHeight = bottom - top + 1;
            double scale = Math.Min(118.0 / cropWidth, 118.0 / cropHeight);
            int drawWidth = Math.Max(1, (int)Math.Round(cropWidth * scale));
            int drawHeight = Math.Max(1, (int)Math.Round(cropHeight * scale));

            using (var destination = new Bitmap(128, 128, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(destination))
            {
                graphics.Clear(Color.Transparent);
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.DrawImage(source,
                    new Rectangle((128 - drawWidth) / 2, (128 - drawHeight) / 2, drawWidth, drawHeight),
                    new Rectangle(left, top, cropWidth, cropHeight), GraphicsUnit.Pixel);
                destination.Save(destinationPath, ImageFormat.Png);
            }
        }
    }
}
