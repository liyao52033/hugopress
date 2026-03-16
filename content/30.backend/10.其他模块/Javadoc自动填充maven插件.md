---
date: 2025-04-26T12:43:13.000Z
title: Javadoc自动填充maven插件
url: /pages/6ae52b
weight: 120
type: docs
categories:
  - 后端
  - 功能扩展
author:
  name: 华总
  link: https://xiaoying.org.cn
icon: menu
tags:
  - SpringBoot
cover: https://cnb.xiaoying.org.cn?random=/pages/f3b474
description: >-
  本文介绍了一款用于自动生成Javadoc注释的Maven插件。该插件旨在满足发布到中央仓库的文档要求，支持Java 8和Java
  17及以上版本。其核心特性包括模块化设计、灵活的配置选项（如自定义注释范围、排除特定文件等）、完善的错误处理机制以及代码复用。用户可通过配置灵活控制是否为类、方法、参数、返回值和异常等元素生成注释，并能与maven-javadoc-plugin集成使用。
license: true
twikoo: true
footer: false
---





## 背景

发布到中央仓库时需要javadoc注释，所以写了这个maven插件用于在构建阶段自动生成注释。该插件同时支持Java 8和Java 17版本。

## 特性

1. **同时支持 Java 8 和 Java 17 及以上**
2. **AI 智能生成**：支持所有主流 AI 服务提供商
3. **多提供商支持**：一键切换 OpenAI、DeepSeek、Moonshot、智谱 AI、百度、阿里、Ollama 等
4. **环境变量支持**：支持从环境变量读取 API Key，避免在 pom.xml 中暴露敏感信息
5. **节省 Token**：自动跳过已有注释的方法，避免重复生成浪费 token
6. **模块化设计**：将代码按职责拆分为多个类，提高代码的可维护性和可扩展性
7. **降级方案**：AI 调用失败时自动降级到规则生成，确保插件稳定运行

## 安装方法

### 项目中使用

{{< alert type="info" >}}

依赖可能非最新版本，请前往[maven](https://central.sonatype.com/artifact/io.github.liyao52033/autofill-javadoc-maven-plugin)获取最新版本

{{</alert >}}

在项目的 `pom.xml` 文件中添加以下依赖

```xml
<dependency>
    <groupId>io.github.liyao52033</groupId>
    <artifactId>autofill-javadoc-maven-plugin</artifactId>
    <version>1.3.0</version>
</dependency>
```

### 命令行使用

####  使用环境变量（推荐）

首先导入环境变量

```sh
export AI_API_KEY=your-api-key
```

然后使用

```sh
mvn io.github.liyao52033:autofill-javadoc-maven-plugin:1.3.0:autofill -DenableAi=true -DaiProvider=DEEPSEEK -DsourceDir=src/main/java
```

#### 使用预设提供商 

```sh
mvn io.github.liyao52033:autofill-javadoc-maven-plugin:1.3.0:autofill -DenableAi=true -DaiApiKey=your-api-key -DaiProvider=DEEPSEEK -DsourceDir=src/main/java
```

#### 自定义配置

```sh
mvn io.github.liyao52033:autofill-javadoc-maven-plugin:1.3.0:autofill -DenableAi=true -DaiApiKey=your-api-key 
-DaiApiUrl=https://api.deepseek.com/v1/chat/completions -DaiModel=deepseek-chat -DsourceDir=src/main/java
```

## 配置选项

### 基本配置

包含以下配置选项，可以在 Maven 配置中自定义：

```xml
<configuration>
    <sourceDir>src/main/java</sourceDir> <!-- 源代码目录 -->
    <addClassJavadoc>true</addClassJavadoc> <!-- 是否添加类注释 -->
    <addMethodJavadoc>true</addMethodJavadoc> <!-- 是否添加方法注释 -->
    <addParamJavadoc>true</addParamJavadoc> <!-- 是否添加参数注释 -->
    <addReturnJavadoc>true</addReturnJavadoc> <!-- 是否添加返回值注释 -->
    <addThrowsJavadoc>true</addThrowsJavadoc> <!-- 是否添加异常注释 -->
    <excludePatterns>
        <excludePattern>.*\/generated\/.*</excludePattern> <!-- 排除生成的代码 -->
        <excludePattern>.*Test\.java</excludePattern> <!-- 排除测试文件 -->
    </excludePatterns> <!-- 排除特定文件的模式列表 -->
    <includePrivateMethods>false</includePrivateMethods> <!-- 是否包含私有方法 -->
</configuration>
```

### AI 配置（可选）

支持所有主流 AI 服务提供商。

#### 方式一：使用环境变量（推荐，更安全）

将 API Key 存储在环境变量中，避免在 pom.xml 中暴露敏感信息：

```bash
# 设置环境变量（Linux/Mac）
export AI_API_KEY=your-api-key-here

# 或者设置特定提供商的环境变量
export DEEPSEEK_API_KEY=your-deepseek-api-key
export OPENAI_API_KEY=your-openai-api-key
```

```xml
<configuration>
    <!-- 启用 AI 生成 -->
    <enableAi>true</enableAi>
    
    <!-- AI 提供商名称（可选，默认 OPENAI） -->
    <aiProvider>DEEPSEEK</aiProvider>
    
    <!-- 跳过已有注释的方法（默认 true，节省 token） -->
    <skipExistingJavadoc>true</skipExistingJavadoc>
</configuration>
```

#### 方式二：使用预设提供商

```xml
<configuration>
    <enableAi>true</enableAi>
    <aiApiKey>your-api-key-here</aiApiKey>
    <aiProvider>DEEPSEEK</aiProvider>
    <skipExistingJavadoc>true</skipExistingJavadoc>
</configuration>
```

#### 方式三：自定义配置

```xml
<configuration>
    <enableAi>true</enableAi>
    <aiApiKey>your-api-key-here</aiApiKey>
    <aiApiUrl>https://api.deepseek.com/v1/chat/completions</aiApiUrl>
    <aiModel>deepseek-chat</aiModel>
</configuration>
```

**支持的 AI 提供商**：

| 提供商        | aiProvider 值 | 默认模型       | API 地址                       |
| ------------- | ------------- | -------------- | ------------------------------ |
| OpenAI        | `OPENAI`      | gpt-3.5-turbo  | https://api.openai.com         |
| DeepSeek      | `DEEPSEEK`    | deepseek-chat  | https://api.deepseek.com       |
| 月之暗面      | `MOONSHOT`    | moonshot-v1-8k | https://api.moonshot.cn        |
| 智谱 AI       | `ZHIPU`       | glm-4          | https://open.bigmodel.cn       |
| Ollama (本地) | `OLLAMA`      | mistral        | http://localhost:11434         |
| 百度文心      | `BAIDU`       | ernie-bot-4    | https://aip.baidubce.com       |
| 阿里通义      | `ALIBABA`     | qwen-turbo     | https://dashscope.aliyuncs.com |
| 自定义        | `CUSTOM`      | gpt-3.5-turbo  | 需指定 aiApiUrl                |

**降级方案**：当 AI 调用失败时（网络问题、API 限流等），插件会自动降级到基于规则的生成模式，确保插件稳定运行。

### 配置选项详细说明

#### 基本配置

| 配置项                  | 说明                                  | 默认值          |
| ----------------------- | ------------------------------------- | --------------- |
| `sourceDir`             | 指定源代码目录                        | `src/main/java` |
| `addClassJavadoc`       | 是否为类/接口/枚举添加 Javadoc 注释   | `true`          |
| `addMethodJavadoc`      | 是否为方法添加 Javadoc 注释           | `true`          |
| `addParamJavadoc`       | 是否为方法参数添加 Javadoc 注释       | `true`          |
| `addReturnJavadoc`      | 是否为方法返回值添加 Javadoc 注释     | `true`          |
| `addThrowsJavadoc`      | 是否为方法抛出的异常添加 Javadoc 注释 | `true`          |
| `includePrivateMethods` | 是否为私有方法生成 Javadoc 注释       | `true`          |

#### 高级配置

- **excludePatterns**: 排除特定文件的正则表达式模式列表。插件将跳过匹配这些模式的文件，不对其进行处理。这对于排除自动生成的代码、测试文件或其他不需要文档的文件非常有用。
  - 每个`<excludePattern>`元素应包含一个有效的正则表达式
  - 文件路径将与这些模式进行匹配，匹配成功的文件将被跳过
  - 默认为空列表，即不排除任何文件

#### AI 配置

| 配置项                | 说明                     | 默认值                                                       |
| --------------------- | ------------------------ | ------------------------------------------------------------ |
| `enableAi`            | 是否启用 AI 生成方法描述 | `false`                                                      |
| `aiApiKey`            | AI API 密钥              | 从环境变量读取（AI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY） |
| `aiApiUrl`            | AI API 地址              | 根据 aiProvider 自动设置                                     |
| `aiModel`             | AI 模型名称              | 根据 aiProvider 自动设置                                     |
| `aiProvider`          | AI 提供商名称            | `OPENAI`                                                     |
| `skipExistingJavadoc` | 是否跳过已有注释的方法   | `true`                                                       |


## 使用方法

### 基础用法（规则生成模式）

```xml
<build>
    <plugins>
        <plugin>
            <groupId>io.github.liyao52033</groupId>
            <artifactId>autofill-javadoc-maven-plugin</artifactId>
            <version>1.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>autofill</goal>
                    </goals>
                    <phase>generate-sources</phase> 
                </execution>
            </executions>
            <configuration>
                <sourceDir>src/main/java</sourceDir>
                <addMethodJavadoc>true</addMethodJavadoc>
                <addParamJavadoc>true</addParamJavadoc>
                <addReturnJavadoc>true</addReturnJavadoc>
                <addThrowsJavadoc>true</addThrowsJavadoc>
                <excludePatterns>
                    <excludePattern>.*\/generated\/.*</excludePattern>
                    <excludePattern>.*Test\.java</excludePattern>
                </excludePatterns>
                <includePrivateMethods>false</includePrivateMethods>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### AI 增强模式

使用 AI 自动生成更智能、更准确的方法描述：

#### 使用 OpenAI

```xml
<build>
    <plugins>
        <plugin>
            <groupId>io.github.liyao52033</groupId>
            <artifactId>autofill-javadoc-maven-plugin</artifactId>
            <version>1.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>autofill</goal>
                    </goals>
                    <phase>generate-sources</phase> 
                </execution>
            </executions>
            <configuration>
                <enableAi>true</enableAi>
                <aiApiKey>sk-xxx</aiApiKey>
                <aiProvider>OPENAI</aiProvider>
            </configuration>
        </plugin>
    </plugins>
</build>
```

#### 使用 DeepSeek（推荐国内用户）

```xml
<build>
    <plugins>
        <plugin>
            <groupId>io.github.liyao52033</groupId>
            <artifactId>autofill-javadoc-maven-plugin</artifactId>
            <version>1.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>autofill</goal>
                    </goals>
                    <phase>generate-sources</phase> 
                </execution>
            </executions>
            <configuration>
                <enableAi>true</enableAi>
                <aiApiKey>your-deepseek-api-key</aiApiKey>
                <aiProvider>DEEPSEEK</aiProvider>
            </configuration>
        </plugin>
    </plugins>
</build>
```

#### 使用 Moonshot（Kimi）

```xml
<build>
    <plugins>
        <plugin>
            <groupId>io.github.liyao52033</groupId>
            <artifactId>autofill-javadoc-maven-plugin</artifactId>
            <version>1.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>autofill</goal>
                    </goals>
                    <phase>generate-sources</phase> 
                </execution>
            </executions>
            <configuration>
                <enableAi>true</enableAi>
                <aiApiKey>your-moonshot-api-key</aiApiKey>
                <aiProvider>MOONSHOT</aiProvider>
            </configuration>
        </plugin>
    </plugins>
</build>
```

#### 使用智谱 AI

```xml
<build>
    <plugins>
        <plugin>
            <groupId>io.github.liyao52033</groupId>
            <artifactId>autofill-javadoc-maven-plugin</artifactId>
            <version>1.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>autofill</goal>
                    </goals>
                    <phase>generate-sources</phase> 
                </execution>
            </executions>
            <configuration>
                <enableAi>true</enableAi>
                <aiApiKey>your-zhipu-api-key</aiApiKey>
                <aiProvider>ZHIPU</aiProvider>
            </configuration>
        </plugin>
    </plugins>
</build>
```

#### 使用本地 Ollama

```xml
<build>
    <plugins>
        <plugin>
            <groupId>io.github.liyao52033</groupId>
            <artifactId>autofill-javadoc-maven-plugin</artifactId>
            <version>1.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>autofill</goal>
                    </goals>
                    <phase>generate-sources</phase> 
                </execution>
            </executions>
            <configuration>
                <enableAi>true</enableAi>
                <aiProvider>OLLAMA</aiProvider>
            </configuration>
        </plugin>
    </plugins>
</build>
```



### 与maven-javadoc-plugin集成发布到中央仓库

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.sonatype.central</groupId>
      <artifactId>central-publishing-maven-plugin</artifactId>
      <version>0.5.0</version>
      <extensions>true</extensions>
      <configuration>
        <publishingServerId>xxx</publishingServerId>
        <checksums>required</checksums>
        <deploymentName>xxx</deploymentName>
      </configuration>
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-source-plugin</artifactId>
      <version>3.2.1</version>
      <executions>
        <execution>
          <id>attach-sources</id>
          <phase>verify</phase>
          <goals>
            <goal>jar-no-fork</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
    <plugin>
      <groupId>io.github.liyao52033</groupId>
      <artifactId>autofill-javadoc-maven-plugin</artifactId>
      <version>1.2.0</version>
      <executions>
        <execution>
          <goals>
            <goal>autofill</goal>
          </goals>
          <phase>generate-sources</phase> <!-- 确保在javadoc之前运行 -->
        </execution>
      </executions>
      <configuration>
        <sourceDir>src/main/java</sourceDir> <!-- 指定源代码目录 -->
        <enableAi>true</enableAi>
        <aiApiKey>your-deepseek-api-key</aiApiKey>
        <aiProvider>DEEPSEEK</aiProvider>
      </configuration>
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-javadoc-plugin</artifactId>
      <version>3.5.0</version>
      <configuration>
        <encoding>UTF-8</encoding>
        <charset>UTF-8</charset>
        <docencoding>UTF-8</docencoding>
      </configuration>
      <executions>
        <execution>
          <id>attach-javadocs</id>
          <goals>
            <goal>jar</goal>
          </goals>
          <phase>verify</phase> <!-- Javadoc 生成在 verify 阶段运行 -->
        </execution>
      </executions>
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-gpg-plugin</artifactId>
      <version>3.2.7</version>
      <executions>
        <execution>
          <id>sign-artifacts</id>
          <phase>verify</phase>
          <goals>
            <goal>sign</goal>
          </goals>
        </execution>
      </executions>
      <configuration>
        <gpgArguments>
          <arg>--pinentry-mode</arg>
          <arg>loopback</arg>
        </gpgArguments>
      </configuration>
    </plugin>
  </plugins>
</build>
```

## 错误处理

提供了完整的错误处理机制，当处理文件过程中出现异常时，插件会：

1. 记录详细的错误信息到日志
2. 继续处理其他文件，不会因单个文件失败而中断整个处理过程
3. 在处理完成后提供处理成功的文件数量统计

## 注意事项

- 插件默认会为类、方法、参数、返回值和异常添加Javadoc注释
- 如果已存在注释，插件不会覆盖，只会补充缺失的部分
- 可以通过配置选项关闭不需要的注释类型