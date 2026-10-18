package com.physiqueai.poselandmarker;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.media.Image;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.google.mediapipe.framework.image.BitmapImageBuilder;
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark;
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker;
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult;
import com.google.mediapipe.tasks.vision.core.RunningMode;
import com.mrousavy.camera.core.types.Orientation;
import com.mrousavy.camera.frameprocessors.Frame;
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class PoseLandmarkerFrameProcessorPlugin extends FrameProcessorPlugin {
  private static final String MODEL_ASSET_PATH = "pose_landmarker_lite.task";
  private final PoseLandmarker landmarker;

  public PoseLandmarkerFrameProcessorPlugin(Context context) {
    try {
      PoseLandmarker.PoseLandmarkerOptions options =
          PoseLandmarker.PoseLandmarkerOptions.builder()
              .setBaseOptions(
                  com.google.mediapipe.tasks.core.BaseOptions.builder()
                      .setModelAssetPath(MODEL_ASSET_PATH)
                      .build())
              .setRunningMode(RunningMode.IMAGE)
              .setNumPoses(1)
              .build();
      landmarker = PoseLandmarker.createFromOptions(context, options);
    } catch (RuntimeException error) {
      throw new IllegalStateException(
          "Unable to initialize MediaPipe Pose Landmarker. Ensure pose_landmarker_lite.task is bundled.",
          error);
    }
  }

  @Override
  public @Nullable Object callback(@NonNull Frame frame, @Nullable Map<String, Object> params)
      throws Throwable {
    Bitmap bitmap = imageToBitmap(frame.getImage(), frame.getOrientation());
    try {
      PoseLandmarkerResult result =
          landmarker.detect(new BitmapImageBuilder(bitmap).build());
      return toLandmarks(result);
    } finally {
      bitmap.recycle();
    }
  }

  private static ArrayList<Map<String, Object>> toLandmarks(PoseLandmarkerResult result) {
    ArrayList<Map<String, Object>> output = new ArrayList<>(33);
    List<List<NormalizedLandmark>> poses = result.landmarks();
    if (poses.isEmpty()) return output;

    List<NormalizedLandmark> pose = poses.get(0);
    for (NormalizedLandmark landmark : pose) {
      Map<String, Object> point = new HashMap<>();
      // VisionCamera converts Java numbers through JSI and does not support
      // java.lang.Float here. Use boxed doubles for every numeric property.
      point.put("x", (double) landmark.x());
      point.put("y", (double) landmark.y());
      point.put("z", (double) landmark.z());
      point.put("visibility", (double) landmark.visibility().orElse(0.0f));
      output.add(point);
    }
    return output;
  }

  private static Bitmap imageToBitmap(Image image, Orientation orientation) {
    if (image.getFormat() != ImageFormat.YUV_420_888) {
      throw new IllegalArgumentException("Pose scanner requires YUV_420_888 camera frames");
    }

    byte[] nv21 = yuv420ToNv21(image);
    YuvImage yuv = new YuvImage(nv21, ImageFormat.NV21, image.getWidth(), image.getHeight(), null);
    ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
    if (!yuv.compressToJpeg(new Rect(0, 0, image.getWidth(), image.getHeight()), 90, jpeg)) {
      throw new IllegalStateException("Unable to convert camera frame to JPEG");
    }

    Bitmap decoded = BitmapFactory.decodeByteArray(jpeg.toByteArray(), 0, jpeg.size());
    if (decoded == null) throw new IllegalStateException("Unable to decode camera frame");
    return rotate(decoded, rotationDegrees(orientation));
  }

  private static int rotationDegrees(Orientation orientation) {
    switch (orientation) {
      case LANDSCAPE_LEFT:
        return 90;
      case LANDSCAPE_RIGHT:
        return 270;
      case PORTRAIT_UPSIDE_DOWN:
        return 180;
      default:
        return 0;
    }
  }

  private static Bitmap rotate(Bitmap source, int degrees) {
    if (degrees == 0) return source;
    Matrix matrix = new Matrix();
    matrix.postRotate(degrees);
    Bitmap rotated = Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
    if (rotated != source) source.recycle();
    return rotated;
  }

  private static byte[] yuv420ToNv21(Image image) {
    int width = image.getWidth();
    int height = image.getHeight();
    Image.Plane[] planes = image.getPlanes();
    byte[] output = new byte[width * height * 3 / 2];
    int outputOffset = 0;

    outputOffset = copyPlane(planes[0], width, height, output, outputOffset, 1);
    byte[] uPlane = readPlane(planes[1], width / 2, height / 2);
    byte[] vPlane = readPlane(planes[2], width / 2, height / 2);
    for (int i = 0; i < uPlane.length; i++) {
      output[outputOffset++] = vPlane[i];
      output[outputOffset++] = uPlane[i];
    }
    return output;
  }

  private static byte[] readPlane(Image.Plane plane, int width, int height) {
    byte[] output = new byte[width * height];
    int outputOffset = copyPlane(plane, width, height, output, 0, plane.getPixelStride());
    if (outputOffset != output.length) {
      throw new IllegalStateException("Unexpected YUV plane size");
    }
    return output;
  }

  private static int copyPlane(
      Image.Plane plane, int width, int height, byte[] output, int outputOffset, int pixelStride) {
    ByteBuffer buffer = plane.getBuffer();
    int rowStride = plane.getRowStride();
    byte[] row = new byte[rowStride];
    for (int rowIndex = 0; rowIndex < height; rowIndex++) {
      int rowLength = Math.min(buffer.remaining(), rowStride);
      buffer.get(row, 0, rowLength);
      for (int column = 0; column < width; column++) {
        int sourceIndex = column * pixelStride;
        if (sourceIndex >= rowLength) throw new IllegalStateException("Invalid YUV row stride");
        output[outputOffset++] = row[sourceIndex];
      }
    }
    return outputOffset;
  }
}
