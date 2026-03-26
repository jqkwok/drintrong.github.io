#!/usr/bin/env python3
"""
测试网站登录流程的脚本
网址：https://qzznt.aseitapps.cn/web/export/index.html
用户名：gjq001
密码：Xw@2024-
验证码：需要从图像中识别
"""

import asyncio
from playwright.async_api import async_playwright
import time
import os
from pathlib import Path

# 创建截图保存目录
SCREENSHOT_DIR = Path("screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)

async def explore_login_page():
    """探索登录页面，截图并分析页面结构"""
    async with async_playwright() as p:
        # 启动浏览器（无头模式）
        browser = await p.chromium.launch(headless=False)  # 设为False以便查看
        context = await browser.new_context()
        page = await context.new_page()

        try:
            print("导航到登录页面...")
            await page.goto("https://qzznt.aseitapps.cn/web/export/index.html", wait_until="networkidle")

            # 等待页面加载
            await page.wait_for_timeout(3000)

            # 截图整个页面
            print("截取页面截图...")
            await page.screenshot(path=SCREENSHOT_DIR / "login_page_full.png", full_page=True)

            # 获取页面标题和URL
            title = await page.title()
            print(f"页面标题: {title}")
            print(f"当前URL: {page.url}")

            # 查找表单元素
            print("\n查找表单元素...")

            # 查找所有输入框
            inputs = await page.query_selector_all("input")
            print(f"找到 {len(inputs)} 个输入框")

            for i, input_elem in enumerate(inputs):
                input_type = await input_elem.get_attribute("type") or "text"
                input_id = await input_elem.get_attribute("id") or f"无ID"
                input_name = await input_elem.get_attribute("name") or f"无name"
                input_placeholder = await input_elem.get_attribute("placeholder") or ""
                print(f"  输入框 {i+1}: type={input_type}, id={input_id}, name={input_name}, placeholder={input_placeholder}")

            # 查找所有按钮
            buttons = await page.query_selector_all("button, input[type='submit'], input[type='button']")
            print(f"\n找到 {len(buttons)} 个按钮")

            for i, button in enumerate(buttons):
                button_text = await button.text_content() or await button.get_attribute("value") or ""
                button_type = await button.get_attribute("type") or "button"
                print(f"  按钮 {i+1}: 文本='{button_text[:30]}', type={button_type}")

            # 查找验证码图像
            print("\n查找验证码图像...")
            images = await page.query_selector_all("img")
            print(f"找到 {len(images)} 个图像")

            for i, img in enumerate(images):
                src = await img.get_attribute("src") or ""
                alt = await img.get_attribute("alt") or ""
                # 检查是否可能是验证码图像
                if "code" in src.lower() or "captcha" in src.lower() or "验证码" in alt or "code" in alt.lower():
                    print(f"  可能是验证码图像 {i+1}: src={src[:50]}, alt={alt}")
                    # 截取验证码图像
                    try:
                        await img.screenshot(path=SCREENSHOT_DIR / f"captcha_{i+1}.png")
                        print(f"    已保存验证码截图: {SCREENSHOT_DIR}/captcha_{i+1}.png")
                    except Exception as e:
                        print(f"    截图失败: {e}")

            # 查找表单
            forms = await page.query_selector_all("form")
            print(f"\n找到 {len(forms)} 个表单")

            for i, form in enumerate(forms):
                form_id = await form.get_attribute("id") or f"form_{i}"
                form_action = await form.get_attribute("action") or ""
                print(f"  表单 {i+1}: id={form_id}, action={form_action}")

                # 截取表单区域
                try:
                    await form.screenshot(path=SCREENSHOT_DIR / f"form_{i+1}.png")
                except:
                    pass

            print("\n探索完成。截图保存在 screenshots/ 目录中。")

        except Exception as e:
            print(f"错误: {e}")
            import traceback
            traceback.print_exc()

        finally:
            # 保持浏览器打开一段时间以便查看
            print("\n浏览器将保持打开30秒...")
            await page.wait_for_timeout(30000)
            await browser.close()

if __name__ == "__main__":
    asyncio.run(explore_login_page())