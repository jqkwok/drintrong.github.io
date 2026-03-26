#!/usr/bin/env python3
"""
分析验证码图像
"""

from PIL import Image
import numpy as np
from pathlib import Path

# 图像路径
captcha_path = Path("screenshots/captcha_original.png")

if not captcha_path.exists():
    print(f"文件不存在: {captcha_path}")
    # 尝试其他路径
    captcha_path = Path("screenshots/captcha_4.png")
    if not captcha_path.exists():
        print(f"文件不存在: {captcha_path}")
        exit(1)

print(f"分析验证码图像: {captcha_path}")

# 打开图像
img = Image.open(captcha_path)

# 基本信息
print(f"图像格式: {img.format}")
print(f"图像模式: {img.mode}")
print(f"图像大小: {img.size} (宽x高)")
print(f"图像信息: {img.info}")

# 显示像素值（缩小版本）
img_small = img.resize((min(50, img.width), min(30, img.height)), Image.Resampling.LANCZOS)
pixels = list(img_small.getdata())

print("\n图像像素值（缩略图）:")
for y in range(img_small.height):
    row = pixels[y * img_small.width:(y + 1) * img_small.width]
    pixel_chars = []
    for pixel in row:
        if isinstance(pixel, tuple):
            # RGB或RGBA
            avg = sum(pixel[:3]) / 3
        else:
            # 灰度
            avg = pixel
        if avg < 100:
            pixel_chars.append("#")
        elif avg < 200:
            pixel_chars.append(".")
        else:
            pixel_chars.append(" ")
    print("".join(pixel_chars))

# 转换为灰度并分析直方图
if img.mode != 'L':
    img_gray = img.convert('L')
else:
    img_gray = img

# 计算直方图
histogram = img_gray.histogram()
print(f"\n灰度直方图 (0-255):")
for i in range(0, 256, 16):
    values = histogram[i:i+16]
    print(f"{i:3d}-{i+15:3d}: {sum(values)}")

# 尝试二值化
threshold = 128
img_binary = img_gray.point(lambda x: 255 if x > threshold else 0)

# 保存处理后的图像
output_dir = Path("screenshots/analysis")
output_dir.mkdir(exist_ok=True)
img_binary.save(output_dir / "captcha_binary.png")
print(f"\n已保存二值化图像: {output_dir}/captcha_binary.png")

# 尝试识别字符轮廓
from PIL import ImageDraw

# 查找连通区域
img_array = np.array(img_binary)
height, width = img_array.shape

print(f"\n图像数组形状: {img_array.shape}")
print(f"像素值范围: {img_array.min()} - {img_array.max()}")

# 显示二值化图像的ASCII表示
print("\n二值化图像ASCII表示:")
for y in range(min(30, height)):
    row = img_array[y, :min(50, width)]
    line = "".join(["#" if pixel == 0 else " " for pixel in row])
    print(line)

print("\n分析完成。")