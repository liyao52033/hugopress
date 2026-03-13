#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import argparse
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print('错误：需要安装 requests 库，请运行：pip install requests')
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class HugoContentOptimizer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path).resolve()
        self.icon_rules = self._init_icon_rules()
        self.backup_icons = self._init_backup_icons()
        self.url_mappings = self._init_url_mappings()
        self.used_urls = set()
        self.updated_files = []
        self.errors = []
        self.deepseek_api_key = os.getenv('DEEPSEEK_API_KEY', '')
        self.deepseek_model = 'deepseek-chat'
        self.deepseek_api_url = 'https://api.deepseek.com/v1/chat/completions'

    def _init_icon_rules(self):
        return {
            '01.前端': 'code',
            '02.后端': 'storage',
            '03.项目实战': 'workspaces',
            '04.开源项目': 'public',
            '05.嵌入式': 'memory',
            '06.python': 'terminal',
            '05.知识点': 'lightbulb',
            '08.代码调试': 'bug_report',
            '10.vue2': 'view_module',
            '15.vue3': 'view_comfy',
            '20.typescript': 'data_object',
            '01.springboot': 'coffee',
            '10.服务器相关': 'dns',
            '15.腾讯云cos对象操作': 'cloud_upload',
            '01.基础知识': 'school',
            '10.数据分析': 'analytics',
            '20.爬虫': 'web_asset',
            '代码生成器': 'build',
            '组件': 'widgets',
            '组件/02.基础组件': 'widgets',
            '组件/05.Form表单组件': 'dynamic_form',
            '组件/08.Feedback反馈组件': 'feedback',
            '组件/10.hooks': 'extension',
            '工具类': 'build',
            '01.常用软件': 'apps',
            '02.git相关': 'merge',
            '10.资源相关': 'inventory',
            '20.运维相关': 'settings',
            'docs': 'auto_stories',
            'docs/01.基础': 'auto_stories',
            'docs/10.开发': 'build',
            'backend': 'code',
            'backend/2.通用模块': 'view_module',
            'backend/10.其他模块': 'more_horiz',
            '30.backend': 'code',
            '30.backend/2.通用模块': 'view_module',
            '30.backend/10.其他模块': 'more_horiz',
            '20.组件': 'widgets',
            '20.组件/02.基础组件': 'widgets',
            '20.组件/05.Form表单组件': 'dynamic_form',
            '20.组件/08.Feedback反馈组件': 'feedback',
            '20.组件/10.hooks': 'extension',
            '10.docs': 'auto_stories',
            '10.docs/01.基础': 'auto_stories',
            '10.docs/10.开发': 'build',
            '01.vuepress1.x': 'view_module',
            '资源': 'build',
            '资源/01.本站插件': 'extension',
            '资源/05.hugo开发': 'construction',
            '04.开源项目/10.vitepress插件': 'extension',
            '04.开源项目/100.其他项目': 'folder_open',
            'pages': 'web',
            '40.工具类': 'build',
            '40.工具类/01.常用软件': 'apps',
            '40.工具类/02.git相关': 'merge',
            '40.工具类/10.资源相关': 'inventory',
            '40.工具类/20.运维相关': 'settings'
        }
    
    def _init_backup_icons(self):
        return [
            'code', 'storage', 'workspaces', 'public', 'memory',
            'lightbulb', 'bug_report', 'view_module', 'view_comfy', 'data_object',
            'coffee', 'dns', 'cloud_upload', 'school', 'analytics',
            'web_asset', 'build', 'widgets', 'extension', 'dynamic_form',
            'feedback', 'apps', 'merge', 'inventory', 'settings',
            'auto_stories', 'construction', 'view_module', 'more_horiz', 'folder_open',
            'web', 'rate_review', 'settings_suggest', 'integration_instructions', 'menu_book',
            'library_books', 'book', 'subject', 'note', 'sticky_note_2',
            'draft', 'edit', 'edit_note', 'edit_square', 'draw',
            'brush', 'palette', 'image', 'photo', 'photo_camera',
            'camera_alt', 'perm_media', 'video_library', 'movie', 'movie_filter',
            'play_circle', 'smart_display', 'music_note', 'audiotrack', 'headphones',
            'volume_up', 'surround_sound', 'dashboard', 'insights', 'assessment',
            'monitor_heart', 'schedule', 'event', 'date_range', 'today',
            'calendar_month', 'timer', 'schedule_send', 'alarm', 'hourglass_empty',
            'watch_later', 'tune', 'admin_panel_settings', 'manage_accounts', 'person',
            'people', 'group', 'group_add', 'supervisor_account', 'work',
            'work_history', 'business', 'domain', 'corporate_fare', 'location_on',
            'place', 'map', 'my_location', 'near_me', 'phone',
            'call', 'contacts', 'contact_mail', 'mail', 'email',
            'mark_email_unread', 'send', 'outbox', 'inbox', 'chat',
            'chat_bubble', 'message', 'sms', 'forum', 'notifications',
            'notifications_active', 'notifications_none', 'announcement', 'campaign', 'help',
            'help_outline', 'question_answer', 'quiz', 'live_help', 'info',
            'info_outline', 'tips_and_updates', 'emoji_objects', 'star', 'star_border',
            'star_half', 'grade', 'bookmark', 'favorite', 'favorite_border',
            'thumb_up', 'thumb_down', 'sentiment_satisfied', 'mood', 'mood_bad',
            'sentiment_very_satisfied', 'sentiment_dissatisfied', 'tag', 'label', 'sell',
            'local_offer', 'bookmark_add', 'bookmark_remove', 'delete', 'delete_outline',
            'delete_forever', 'restore', 'restore_from_trash', 'save', 'save_alt',
            'download', 'download_done', 'upload', 'cloud', 'cloud_queue',
            'cloud_done', 'folder', 'create_new_folder', 'folder_shared', 'folder_zip',
            'file_copy', 'content_copy', 'content_cut', 'content_paste', 'redo',
            'undo', 'refresh', 'sync', 'sync_alt', 'cached',
            'search', 'search_off', 'manage_search', 'filter_alt', 'sort',
            'view_list', 'view_agenda', 'view_sidebar', 'visibility', 'visibility_off',
            'zoom_in', 'zoom_out', 'fullscreen', 'fullscreen_exit', 'aspect_ratio',
            'crop', 'rotate_left', 'rotate_right', 'link', 'link_off',
            'open_in_new', 'open_in_full', 'launch', 'share', 'share_location',
            'ios_share', 'qr_code', 'qrcode', 'print', 'print_disabled',
            'picture_as_pdf', 'text_snippet', 'attach_file', 'attach_email', 'attachment',
            'cloud_sync', 'system_update', 'update', 'upgrade', 'system_update_alt',
            'downloading', 'upload_file', 'file_present', 'file_open', 'drive_file_move',
            'folder_copy', 'drive_folder_upload', 'cloud_circle', 'archive', 'inventory_2',
            'receipt', 'receipt_long', 'point_of_sale', 'shopping_cart', 'shopping_bag',
            'local_mall', 'storefront', 'store', 'shop', 'local_grocery_store',
            'local_cafe', 'local_dining', 'restaurant', 'fastfood', 'local_bar',
            'local_drink', 'wine_bar', 'sports_bar', 'nightlife', 'local_hotel',
            'hotel', 'bed', 'king_bed', 'single_bed', 'local_florist',
            'local_gas_station', 'local_pharmacy', 'local_hospital', 'medical_services', 'local_police',
            'local_fire_department', 'local_library', 'local_post_office', 'local_atm', 'local_printshop',
            'local_laundry_service', 'local_taxi', 'local_shipping', 'local_car_wash', 'local_parking',
            'local_play', 'local_movies', 'local_activity', 'local_convenience_store', 'app_settings_alt',
            'dashboard_customize', 'grid_view', 'table_chart', 'bar_chart', 'pie_chart',
            'scatter_plot', 'show_chart', 'timeline', 'trending_up', 'trending_down',
            'trending_flat', 'account_balance', 'account_balance_wallet', 'credit_card', 'payments',
            'payment', 'monetization_on', 'money', 'attach_money', 'request_quote',
            'price_check', 'shopping_cart_checkout', 'add_shopping_cart', 'remove_shopping_cart', 'store_mall_directory',
            'gift_card', 'redeem', 'loyalty', 'card_giftcard', 'confirmation_number',
            'ticket', 'event_available', 'event_busy', 'event_note', 'calendar_view_day',
            'calendar_view_week', 'calendar_view_month', 'calendar_today', 'add_to_drive', 'cloud_off'
        ]
    
    def _init_url_mappings(self):
        return {
            '01.前端': '/front/',
            '01.前端/05.知识点': '/front/knowledge/',
            '01.前端/08.代码调试': '/front/debug/',
            '01.前端/10.vue2': '/front/vue2/',
            '01.前端/15.vue3': '/front/vue3/',
            '01.前端/20.typescript': '/front/typescript/',
            '02.后端': '/springboot/',
            '02.后端/01.springboot': '/backend/springboot/',
            '02.后端/10.服务器相关': '/backend/server/',
            '02.后端/15.腾讯云cos对象操作': '/backend/tencentcos/',
            '03.项目实战': '/projects/',
            '03.项目实战/02. 代码生成器': '/projects/code-generator/',
            '04.开源项目': '/opensource/',
            '04.开源项目/01.vuepress1.x': '/opensource/vuepress1x/',
            '05.嵌入式': '/embedded/',
            '05.嵌入式/01.基础知识': '/embedded/basics/',
            '06.python': '/python/',
            '06.python/10.数据分析': '/python/analysis/',
            '06.python/20.爬虫': '/python/spider/',
            '组件': '/components/',
            '组件/02.基础组件': '/components/basic/',
            '组件/05.Form表单组件': '/components/form/',
            '组件/08.Feedback反馈组件': '/components/feedback/',
            '组件/10.hooks': '/components/hooks/',
            '工具类': '/tools/',
            '工具类/01.本站插件': '/tools/plugins',
            '工具类/05.hugo开发': '/tools/hugo',
            '工具类/10.运维相关': '/tools/yunwei',
            'docs': '/docs/guide/',
            'docs/01.基础': '/docs/install',
            'docs/10.开发': '/docs/develop',
            'backend': '/backend/',
            'backend/2.通用模块': '/backend/common/',
            'backend/10.其他模块': '/backend/other/'
        }

    def _match_icon(self, file_path: Path) -> str:
        try:
            relative_path = file_path.relative_to(self.base_path)
            parent = relative_path.parent
        except ValueError:
            parent = file_path.parent
        
        parent_str = str(parent)
        
        for rule in sorted(self.icon_rules.keys(), key=len, reverse=True):
            if rule in parent_str:
                return self.icon_rules[rule]
        
        for part in parent.parts:
            for rule in sorted(self.icon_rules.keys(), key=len, reverse=True):
                if rule in part:
                    return self.icon_rules[rule]
        
        return 'widgets'

    def _calculate_weight_from_folder(self, file_path: Path) -> int:
        try:
            parent_dir = file_path.parent
            dir_name = parent_dir.name
            
            match = re.match(r'^(\d+)\.', dir_name)
            if match:
                num = int(match.group(1))
                return num * 10
        except Exception:
            pass
        
        return 10

    def _update_icon(self, file_path: Path, icon: str):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            frontmatter_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not frontmatter_match:
                return False
            
            frontmatter = frontmatter_match.group(1)
            new_frontmatter = frontmatter
            
            if 'icon:' in new_frontmatter:
                new_frontmatter = re.sub(r'icon:\s*.*', f'icon: {icon}', new_frontmatter)
            else:
                new_frontmatter = new_frontmatter + f'\nicon: {icon}'
            
            weight = self._calculate_weight_from_folder(file_path)
            if 'weight:' in new_frontmatter:
                new_frontmatter = re.sub(r'weight:\s*\d+', f'weight: {weight}', new_frontmatter)
            else:
                new_frontmatter = new_frontmatter + f'\nweight: {weight}'
            
            new_content = content.replace(frontmatter_match.group(0), f'---\n{new_frontmatter}\n---')
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                self.updated_files.append(str(file_path))
                return True
            
            return False
        except Exception as e:
            self.errors.append(f'Error updating icon in {file_path}: {str(e)}')
            return False

    def _filter_content(self, content: str) -> str:
        skip_sections = ['前情回顾', '回顾']
        
        lines = content.split('\n')
        filtered_lines = []
        skip_current = False
        
        for line in lines:
            stripped = line.strip()
            
            if stripped.startswith('##') or stripped.startswith('#'):
                section_name = stripped.lstrip('#').strip()
                skip_current = any(skip in section_name for skip in skip_sections)
            
            if not skip_current:
                filtered_lines.append(line)
        
        return '\n'.join(filtered_lines)

    def _call_deepseek_api(self, title: str, content: str) -> str:
        if not self.deepseek_api_key or self.deepseek_api_key == 'your_deepseek_api_key_here':
            return None
        
        filtered_content = self._filter_content(content)
        
        content_text = re.sub(r'^---\n.*?\n---', '', filtered_content, flags=re.DOTALL).strip()
        content_text = re.sub(r'```[\s\S]*?```', '', content_text)
        content_text = re.sub(r'!\[.*?\]\(.*?\)', '', content_text)
        content_text = re.sub(r'{{<.*?>}}', '', content_text)
        content_text = re.sub(r'{{%.*?%}}', '', content_text)
        content_text = re.sub(r'\|.*?\|', '', content_text)
        
        max_tokens = 8000
        if len(content_text) > max_tokens * 2:
            content_text = content_text[:max_tokens * 2]
        
        prompt = f"""请为以下文章生成一个50-150字的摘要，要求：
1. 概括文章的主要内容和核心要点
2. 语言简洁明了
3. 不要包含markdown格式
4. 只返回摘要内容，不要其他说明

文章标题：{title}

文章内容：
{content_text}
"""
        
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.deepseek_api_key}'
            }
            
            data = {
                'model': self.deepseek_model,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 200
            }
            
            response = requests.post(self.deepseek_api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            summary = result['choices'][0]['message']['content'].strip()
            
            summary = summary.replace('"', '\\"')
            summary = summary.replace('\n', ' ')
            summary = re.sub(r'\s+', ' ', summary).strip()
            
            return summary
        except Exception as e:
            self.errors.append(f'DeepSeek API 调用失败: {str(e)}')
            return None

    def _generate_description(self, file_path: Path, title: str, content: str) -> str:
        ai_summary = self._call_deepseek_api(title, content)
        
        if ai_summary:
            return ai_summary
        
        return f'本文介绍{title}的相关内容和使用方法，帮助开发者提升开发效率。'

    def _clean_frontmatter(self, frontmatter: str) -> str:
        lines = frontmatter.split('\n')
        cleaned_lines = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith('#'):
                cleaned_lines.append(line)
                continue
            
            if stripped.startswith('permalink:'):
                continue
            if stripped.startswith('titleTag:'):
                continue
            if stripped.startswith('autoSort:'):
                continue
            
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)

    def _parse_frontmatter(self, frontmatter: str):
        lines = frontmatter.split('\n')
        in_multiline = False
        in_block_scalar = False
        current_key = None
        current_value = []
        fields = {}
        
        for line in lines:
            stripped = line.strip()
            
            if not in_multiline and not in_block_scalar:
                if ':' in stripped:
                    key_part, value_part = stripped.split(':', 1)
                    key = key_part.strip()
                    value = value_part.strip()
                    
                    if value in ['>', '>-', '|', '|-']:
                        in_block_scalar = True
                        current_key = key
                        current_value = []
                    elif (value.startswith('"') and not value.endswith('"')) or (value.startswith("'") and not value.endswith("'")):
                        in_multiline = True
                        current_key = key
                        current_value = [value]
                    elif (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                        fields[key] = value.strip('"\'')
                    else:
                        fields[key] = value
                else:
                    if stripped and not stripped.startswith('#'):
                        if current_key:
                            current_value.append(line)
            elif in_block_scalar:
                if not stripped or stripped.startswith('#'):
                    current_value.append(line)
                elif line.startswith(' ') or line.startswith('\t'):
                    current_value.append(line)
                else:
                    in_block_scalar = False
                    if current_key:
                        full_value = '\n'.join(current_value).strip()
                        fields[current_key] = full_value
                        current_key = None
                        current_value = []
                    if ':' in stripped:
                        key_part, value_part = stripped.split(':', 1)
                        key = key_part.strip()
                        value = value_part.strip()
                        if value in ['>', '>-', '|', '|-']:
                            in_block_scalar = True
                            current_key = key
                            current_value = []
                        elif (value.startswith('"') and not value.endswith('"')) or (value.startswith("'") and not value.endswith("'")):
                            in_multiline = True
                            current_key = key
                            current_value = [value]
                        elif (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                            fields[key] = value.strip('"\'')
                        else:
                            fields[key] = value
            else:
                current_value.append(line)
                if stripped.endswith('"') or stripped.endswith("'"):
                    in_multiline = False
                    if current_key:
                        full_value = '\n'.join(current_value)
                        fields[current_key] = full_value.strip('"\'')
                        current_key = None
                        current_value = []
        
        if in_block_scalar and current_key:
            full_value = '\n'.join(current_value).strip()
            fields[current_key] = full_value
        
        if in_multiline and current_key:
            full_value = '\n'.join(current_value)
            fields[current_key] = full_value.strip('"\'')
        
        return fields

    def _has_valid_description(self, frontmatter: str) -> bool:
        try:
            fields = self._parse_frontmatter(frontmatter)
            if 'description' not in fields:
                return False
            desc = fields['description'].strip()
            if not desc or desc == 'null':
                return False
            return True
        except Exception:
            return False

    def _update_article(self, file_path: Path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            frontmatter_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not frontmatter_match:
                return False
            
            frontmatter = frontmatter_match.group(1)
            
            title = ''
            for line in frontmatter.split('\n'):
                line = line.strip()
                if line.startswith('title:'):
                    title_part = line[6:].strip()
                    if title_part.startswith('"') or title_part.startswith("'"):
                        title = title_part[1:-1]
                    else:
                        title = title_part
                    break
            
            has_valid_desc = self._has_valid_description(frontmatter)
            has_redundant_fields = 'permalink:' in frontmatter or 'titleTag:' in frontmatter or 'autoSort:' in frontmatter
            
            if not has_redundant_fields and has_valid_desc:
                return False
            
            cleaned_frontmatter = self._clean_frontmatter(frontmatter)
            
            if not has_valid_desc:
                description = self._generate_description(file_path, title, content)
                
                lines = cleaned_frontmatter.split('\n')
                new_lines = []
                skip_until_next_key = False
                
                for line in lines:
                    stripped = line.strip()
                    
                    if skip_until_next_key:
                        if ':' in stripped and not stripped.startswith(' '):
                            skip_until_next_key = False
                        else:
                            continue
                    
                    if stripped.startswith('description:'):
                        value_part = stripped[12:].strip()
                        if value_part in ['>', '>-', '|', '|-']:
                            skip_until_next_key = True
                        continue
                    
                    new_lines.append(line)
                
                cleaned_frontmatter = '\n'.join(new_lines)
                cleaned_frontmatter = cleaned_frontmatter + f'\ndescription: "{description}"'
            
            new_content = content.replace(frontmatter_match.group(0), f'---\n{cleaned_frontmatter}\n---')
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                self.updated_files.append(str(file_path))
                return True
            
            return False
        except Exception as e:
            self.errors.append(f'Error updating article {file_path}: {str(e)}')
            return False

    def process_directory(self, directory: str = None):
        if directory:
            target_dir = Path(directory).resolve()
        else:
            target_dir = self.base_path
        
        if not target_dir.exists():
            print(f'错误：目录不存在 - {target_dir}')
            return False
        
        print(f'正在处理目录: {target_dir}')
        
        self._collect_existing_urls(self.base_path)
        
        self._create_missing_index_files(target_dir)
        
        index_files = list(target_dir.rglob('_index.md'))
        print(f'找到 {len(index_files)} 个 _index.md 文件')
        
        index_by_top_dir = {}
        for index_file in index_files:
            try:
                relative_path = index_file.relative_to(self.base_path)
                parts = list(relative_path.parts)
                if len(parts) >= 1:
                    top_dir = parts[0]
                    if top_dir not in index_by_top_dir:
                        index_by_top_dir[top_dir] = []
                    index_by_top_dir[top_dir].append(index_file)
            except ValueError:
                if 'default' not in index_by_top_dir:
                    index_by_top_dir['default'] = []
                index_by_top_dir['default'].append(index_file)
        
        for top_dir, files in index_by_top_dir.items():
            print(f'\n处理顶级目录: {top_dir}')
            
            used_icons = set()
            files_with_specific_rule = []
            files_without_rule = []
            
            for index_file in files:
                icon = self._match_icon(index_file)
                if icon != 'widgets':
                    files_with_specific_rule.append((index_file, icon))
                else:
                    files_without_rule.append(index_file)
            
            for index_file, icon in files_with_specific_rule:
                if icon in used_icons:
                    for backup_icon in self.backup_icons:
                        if backup_icon not in used_icons:
                            icon = backup_icon
                            break
                used_icons.add(icon)
                self._update_icon(index_file, icon)
                print(f'  - {index_file.name}: {icon}')
            
            for index_file in files_without_rule:
                icon = None
                for backup_icon in self.backup_icons:
                    if backup_icon not in used_icons:
                        icon = backup_icon
                        break
                if icon is None:
                    icon = 'widgets'
                used_icons.add(icon)
                self._update_icon(index_file, icon)
                print(f'  - {index_file.name}: {icon}')
        
        article_files = []
        for md_file in target_dir.rglob('*.md'):
            if md_file.name != '_index.md':
                article_files.append(md_file)
        
        print(f'\n找到 {len(article_files)} 个文章文件')
        
        for article_file in article_files:
            self._update_article(article_file)
        
        self.print_summary()
        return True

    def _collect_existing_urls(self, target_dir: Path):
        for index_file in target_dir.rglob('_index.md'):
            try:
                with open(index_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                frontmatter_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
                if frontmatter_match:
                    frontmatter = frontmatter_match.group(1)
                    url_match = re.search(r'url:\s*([\'"]?)(.*?)\1', frontmatter)
                    if url_match:
                        url = url_match.group(2).strip()
                        self.used_urls.add(url)
            except Exception as e:
                pass

    def _match_url(self, dir_path: Path) -> str:
        try:
            relative_path = dir_path.relative_to(self.base_path)
            relative_str = str(relative_path).replace('\\', '/')
        except ValueError:
            relative_str = dir_path.name
        
        for rule in sorted(self.url_mappings.keys(), key=len, reverse=True):
            if rule in relative_str:
                return self.url_mappings[rule]
        
        return None

    def _generate_index_content(self, dir_path: Path, icon: str):
        try:
            relative_path = dir_path.relative_to(self.base_path)
        except ValueError:
            relative_path = dir_path.name
        
        dir_name = dir_path.name
        
        title = dir_name
        if '.' in title:
            parts = title.split('.', 1)
            if parts[0].isdigit():
                title = parts[1]
        
        url = self._match_url(dir_path)
        
        weight = 10
        match = re.match(r'^(\d+)\.', dir_name)
        if match:
            num = int(match.group(1))
            weight = num * 10
        
        content_lines = [
            '---',
            f'title: {title}',
            f'description: {title}相关内容',
            f'weight: {weight}'
        ]
        
        if url:
            content_lines.append(f'url: {url}')
        
        content_lines.extend([
            'type: docs',
            f'icon: {icon}',
            '---',
            ''
        ])
        
        return '\n'.join(content_lines)

    def _create_missing_index_files(self, target_dir: Path):
        content_dirs = set()
        
        content_dirs.add(target_dir)
        
        for md_file in target_dir.rglob('*.md'):
            parent = md_file.parent
            content_dirs.add(parent)
        
        for dir_path in content_dirs:
            if dir_path.resolve() == self.base_path.resolve():
                continue
            index_file = dir_path / '_index.md'
            if not index_file.exists():
                icon = self._match_icon(dir_path / '_index.md')
                content = self._generate_index_content(dir_path, icon)
                
                try:
                    with open(index_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    self.updated_files.append(str(index_file))
                except Exception as e:
                    self.errors.append(f'创建 _index.md 失败 {index_file}: {str(e)}')

    def print_summary(self):
        print('\n' + '='*60)
        print('处理完成！')
        print('='*60)
        print(f'更新文件数: {len(self.updated_files)}')
        
        if self.updated_files:
            print('\n更新的文件:')
            for f in self.updated_files:
                print(f'  - {f}')
        
        if self.errors:
            print(f'\n错误数: {len(self.errors)}')
            print('\n错误信息:')
            for err in self.errors:
                print(f'  - {err}')


def main():
    parser = argparse.ArgumentParser(description='Hugo 内容优化器')
    parser.add_argument(
        '--path',
        type=str,
        default='content',
        help='要处理的目录路径（默认为 content 目录）'
    )
    
    args = parser.parse_args()
    
    current_dir = Path.cwd()
    
    base_path = current_dir / 'content'
    if not base_path.exists():
        base_path = current_dir
    
    optimizer = HugoContentOptimizer(base_path)
    success = optimizer.process_directory(args.path)
    
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
