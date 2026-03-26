#!/usr/bin/env python3
"""
深入检查验证码元素
"""

import asyncio
from playwright.async_api import async_playwright
import base64
import re
from pathlib import Path

async def inspect_captcha():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            print("导航到登录页面...")
            await page.goto("https://qzznt.aseitapps.cn/web/export/index.html", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            print("\n查找所有图像元素...")
            images = await page.query_selector_all("img")

            for i, img in enumerate(images):
                src = await img.get_attribute("src") or ""
                alt = await img.get_attribute("alt") or ""
                width = await img.get_attribute("width")
                height = await img.get_attribute("height")
                class_name = await img.get_attribute("class") or ""
                style = await img.get_attribute("style") or ""

                print(f"\n图像 {i+1}:")
                print(f"  src: {src[:100]}{'...' if len(src) > 100 else ''}")
                print(f"  alt: {alt}")
                print(f"  尺寸: {width}x{height}")
                print(f"  class: {class_name}")
                print(f"  style: {style[:50]}")

                # 检查是否是base64图像
                if src.startswith("data:image"):
                    print(f"  类型: base64图像")
                    # 提取base64数据
                    match = re.match(r'data:image/(\w+);base64,(.+)', src)
                    if match:
                        img_format, b64_data = match.groups()
                        print(f"  格式: {img_format}, 数据长度: {len(b64_data)}")

                        # 解码并保存
                        try:
                            img_data = base64.b64decode(b64_data)
                            filename = f"screenshots/captcha_base64_{i+1}.{img_format}"
                            with open(filename, "wb") as f:
                                f.write(img_data)
                            print(f"  已保存: {filename}")
                        except Exception as e:
                            print(f"  解码失败: {e}")

                # 如果是验证码相关图像
                if "验证码" in alt or "code" in alt.lower() or "captcha" in class_name.lower() or "code" in class_name.lower():
                    print(f"  → 可能是验证码图像!")

                    # 截图该元素
                    try:
                        await img.screenshot(path=f"screenshots/captcha_element_{i+1}.png")
                        print(f"  已截图元素")
                    except Exception as e:
                        print(f"  截图失败: {e}")

                    # 获取计算样式
                    try:
                        computed_style = await page.evaluate("""(element) => {
                            const style = window.getComputedStyle(element);
                            return {
                                display: style.display,
                                visibility: style.visibility,
                                width: style.width,
                                height: style.height,
                                backgroundColor: style.backgroundColor
                            };
                        }""", img)
                        print(f"  计算样式: {computed_style}")
                    except Exception as e:
                        print(f"  获取样式失败: {e}")

            print("\n查找验证码输入框及其周围元素...")
            # 查找验证码输入框
            captcha_inputs = await page.query_selector_all("input[placeholder*='验证码'], input[placeholder*='code']")

            for i, inp in enumerate(captcha_inputs):
                print(f"\n验证码输入框 {i+1}:")
                placeholder = await inp.get_attribute("placeholder") or ""
                id_attr = await inp.get_attribute("id") or ""
                name_attr = await inp.get_attribute("name") or ""
                class_attr = await inp.get_attribute("class") or ""

                print(f"  placeholder: {placeholder}")
                print(f"  id: {id_attr}")
                print(f"  name: {name_attr}")
                print(f"  class: {class_attr}")

                # 查找相邻的验证码图像
                try:
                    # 查找前一个或后一个图像元素
                    parent = await inp.evaluate_handle("el => el.parentElement")
                    siblings = await parent.query_selector_all("img")
                    if siblings:
                        print(f"  找到同级的 {len(siblings)} 个图像元素")
                except:
                    pass

            print("\n检查页面HTML结构...")
            # 获取登录表单区域的HTML
            forms = await page.query_selector_all("form")
            for i, form in enumerate(forms):
                form_html = await form.inner_html()
                print(f"\n表单 {i+1} HTML (前500字符):")
                print(form_html[:500])

            print("\n执行JavaScript检查验证码...")
            # 检查是否有验证码相关的JavaScript变量
            captcha_info = await page.evaluate("""() => {
                const result = {};

                // 检查全局变量
                for (let key in window) {
                    if (key.toLowerCase().includes('captcha') ||
                        key.toLowerCase().includes('code') ||
                        key.toLowerCase().includes('verify')) {
                        try {
                            result[key] = typeof window[key];
                        } catch (e) {
                            result[key] = 'access denied';
                        }
                    }
                }

                return result;
            }""")

            if captcha_info:
                print("找到验证码相关全局变量:")
                for key, value in captcha_info.items():
                    print(f"  {key}: {value}")

        except Exception as e:
            print(f"错误: {e}")
            import traceback
            traceback.print_exc()

        finally:
            print("\n检查完成。浏览器将保持打开30秒...")
            await page.wait_for_timeout(30000)
            await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_captcha())