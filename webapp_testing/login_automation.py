#!/usr/bin/env python3
"""
登录测试脚本 - 尝试自动识别验证码并登录
"""

import asyncio
from playwright.async_api import async_playwright
from PIL import Image
import io
import base64
import time
import os
from pathlib import Path
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 截图保存目录
SCREENSHOT_DIR = Path("screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)

# 用户凭据
USERNAME = "gjq001"
PASSWORD = "Xw@2024-"

def preprocess_captcha(image_path):
    """预处理验证码图像以提高OCR识别率"""
    try:
        from PIL import Image, ImageFilter, ImageOps

        img = Image.open(image_path)

        # 转换为灰度
        img = img.convert('L')

        # 增强对比度
        img = ImageOps.autocontrast(img, cutoff=5)

        # 二值化
        threshold = 128
        img = img.point(lambda x: 255 if x > threshold else 0)

        # 去噪
        img = img.filter(ImageFilter.MedianFilter(size=3))

        # 保存处理后的图像
        processed_path = SCREENSHOT_DIR / "captcha_processed.png"
        img.save(processed_path)
        logger.info(f"已保存处理后的验证码图像: {processed_path}")

        return processed_path
    except Exception as e:
        logger.error(f"验证码预处理失败: {e}")
        return image_path

def recognize_captcha_simple(image_path):
    """尝试使用简单方法识别验证码"""
    try:
        # 尝试导入pytesseract
        import pytesseract

        # 预处理图像
        processed_path = preprocess_captcha(image_path)

        # 使用pytesseract识别
        captcha_text = pytesseract.image_to_string(
            Image.open(processed_path),
            config='--psm 8 --oem 3 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
        ).strip()

        logger.info(f"OCR识别结果: '{captcha_text}'")

        # 清理结果：只保留字母数字
        import re
        captcha_text = re.sub(r'[^A-Za-z0-9]', '', captcha_text)

        if len(captcha_text) >= 4:
            return captcha_text[:6]  # 通常验证码为4-6个字符
        else:
            logger.warning(f"识别结果太短: '{captcha_text}'")
            return None

    except ImportError:
        logger.warning("pytesseract不可用，尝试手动识别")
        return None
    except Exception as e:
        logger.error(f"OCR识别失败: {e}")
        return None

async def manual_captcha_input(page):
    """手动输入验证码的备用方法"""
    logger.info("等待手动输入验证码...")

    # 显示验证码图像给用户
    captcha_elements = await page.query_selector_all("img")
    for i, img in enumerate(captcha_elements):
        src = await img.get_attribute("src") or ""
        if "base/static/assets/" in src:  # 根据之前探索的结果
            await img.screenshot(path=SCREENSHOT_DIR / "captcha_for_manual.png")
            logger.info(f"验证码图像已保存: {SCREENSHOT_DIR}/captcha_for_manual.png")
            break

    # 在实际自动化中，这里应该暂停并等待用户输入
    # 但为了演示，我们返回一个示例值
    logger.warning("需要手动输入验证码。在真实场景中，应在此暂停并等待用户输入。")
    return "1234"  # 示例值，实际应该从用户获取

async def test_login():
    """测试登录流程"""
    async with async_playwright() as p:
        # 启动浏览器（有头模式以便查看）
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        try:
            logger.info("步骤1: 导航到登录页面")
            await page.goto("https://qzznt.aseitapps.cn/web/export/index.html", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # 截图登录页面
            await page.screenshot(path=SCREENSHOT_DIR / "01_login_page.png", full_page=True)
            logger.info(f"已截图: {SCREENSHOT_DIR}/01_login_page.png")

            logger.info("步骤2: 查找登录表单元素")

            # 查找用户名输入框
            username_inputs = await page.query_selector_all("input[placeholder*='账号'], input[placeholder*='用户'], input[placeholder*='账户']")
            if not username_inputs:
                # 尝试查找第一个文本输入框
                all_inputs = await page.query_selector_all("input[type='text']")
                username_input = all_inputs[0] if len(all_inputs) > 0 else None
            else:
                username_input = username_inputs[0]

            # 查找密码输入框
            password_inputs = await page.query_selector_all("input[type='password']")
            password_input = password_inputs[0] if password_inputs else None

            # 查找验证码输入框
            captcha_inputs = await page.query_selector_all("input[placeholder*='验证码'], input[placeholder*='code'], input[placeholder*='Code']")
            if not captcha_inputs:
                # 尝试查找第三个文本输入框
                all_text_inputs = await page.query_selector_all("input[type='text']")
                captcha_input = all_text_inputs[2] if len(all_text_inputs) > 2 else None
            else:
                captcha_input = captcha_inputs[0]

            # 查找登录按钮
            login_buttons = await page.query_selector_all("button:has-text('登录'), input[type='submit'][value*='登录'], button[type='submit']")
            login_button = login_buttons[0] if login_buttons else None

            if not all([username_input, password_input, captcha_input, login_button]):
                logger.error("无法找到所有表单元素")
                await page.screenshot(path=SCREENSHOT_DIR / "02_form_elements_not_found.png", full_page=True)
                return False

            logger.info("步骤3: 获取验证码图像")
            captcha_img = None
            images = await page.query_selector_all("img")
            for img in images:
                src = await img.get_attribute("src") or ""
                if "base/static/assets/" in src:
                    captcha_img = img
                    break

            if not captcha_img:
                logger.warning("未找到验证码图像")
                await page.screenshot(path=SCREENSHOT_DIR / "03_captcha_not_found.png")
            else:
                # 截取验证码图像
                captcha_path = SCREENSHOT_DIR / "captcha_original.png"
                await captcha_img.screenshot(path=captcha_path)
                logger.info(f"已保存验证码图像: {captcha_path}")

                # 尝试识别验证码
                captcha_text = recognize_captcha_simple(captcha_path)

                if not captcha_text:
                    logger.warning("自动识别验证码失败，使用备用方法")
                    captcha_text = await manual_captcha_input(page)

            logger.info("步骤4: 填写登录表单")

            # 输入用户名
            await username_input.fill(USERNAME)
            await page.wait_for_timeout(500)

            # 输入密码
            await password_input.fill(PASSWORD)
            await page.wait_for_timeout(500)

            # 输入验证码（如果已识别）
            if captcha_text:
                await captcha_input.fill(captcha_text)
                await page.wait_for_timeout(500)

                # 截图填写后的表单
                await page.screenshot(path=SCREENSHOT_DIR / "04_form_filled.png")
                logger.info(f"已填写表单，验证码: {captcha_text}")

                logger.info("步骤5: 点击登录按钮")
                await login_button.click()
                await page.wait_for_timeout(3000)

                # 截图登录后的页面
                await page.screenshot(path=SCREENSHOT_DIR / "05_after_login.png", full_page=True)
                logger.info(f"已截图登录后页面: {SCREENSHOT_DIR}/05_after_login.png")

                # 检查是否登录成功
                current_url = page.url
                logger.info(f"登录后URL: {current_url}")

                # 检查是否有错误消息
                error_messages = await page.query_selector_all(".error, .alert, .message")
                if error_messages:
                    for error in error_messages:
                        error_text = await error.text_content()
                        logger.warning(f"错误消息: {error_text}")

                # 检查是否重定向到其他页面（登录成功）
                if "login" not in current_url.lower():
                    logger.info("可能登录成功 - 已重定向到非登录页面")
                    return True
                else:
                    logger.warning("可能登录失败 - 仍然在登录页面")
                    return False
            else:
                logger.error("未获取到验证码，无法完成登录")
                return False

        except Exception as e:
            logger.error(f"登录测试失败: {e}")
            import traceback
            traceback.print_exc()

            # 截图错误状态
            await page.screenshot(path=SCREENSHOT_DIR / "error_state.png", full_page=True)
            return False

        finally:
            # 保持浏览器打开以便查看结果
            logger.info("测试完成。浏览器将保持打开60秒...")
            await page.wait_for_timeout(60000)
            await browser.close()

if __name__ == "__main__":
    logger.info("开始登录测试...")
    success = asyncio.run(test_login())

    if success:
        logger.info("登录测试完成 - 可能成功")
    else:
        logger.warning("登录测试完成 - 可能失败")

    logger.info(f"截图保存在: {SCREENSHOT_DIR.absolute()}")