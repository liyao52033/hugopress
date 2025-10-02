---
date: 2025-04-26T12:43:13.000Z
title: Javadoc自动填充maven插件
url: /pages/6ae52b
weight: 120
type: docs
description: >-
  Javadoc自动填充Maven插件专为满足发布中央仓库时的注释需求设计，支持多版本Java，采用模块化设计，提供丰富配置选项，能自动补充缺失的类、方法及参数等注释。插件具备完善的错误处理机制，确保构建过程稳定。用户可单独使用或与maven-javadoc-plugin集成，方便快捷地生成完整的Javadoc文档。
categories:
  - 后端
  - 功能扩展
author:
  name: liyao
  link: https://xiaoying.org.cn
icon: menu
tags: []
---



## 背景
发布到中央仓库时需要javadoc注释，所以写了这个maven插件用于在构建阶段自动生成注释。该插件同时支持Java 8和Java 17版本。

## 特性

1. **同时支持Java 8和Java 17及以上**
2. **模块化设计**：将代码按职责拆分为多个类，提高代码的可维护性和可扩展性
3. **配置灵活性**：增加了多个配置选项，允许用户自定义Javadoc生成行为
4. **错误处理**：改进了异常处理机制，提高代码的健壮性
5. **代码复用**：提取重复代码为通用方法，减少代码冗余

## 使用方法

{{< alert type="info" >}}

依赖可能非最新版本，请前往[maven](https://central.sonatype.com/artifact/io.github.liyao52033/autofill-javadoc-maven-plugin)获取最新版本

{{</alert >}}

### 单独使用

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
                <sourceDir>src/main/java</sourceDir> <!-- 指定源代码目录 -->
                <addClassJavadoc>true</addClassJavadoc> <!-- 是否添加类注释 -->
                <addMethodJavadoc>true</addMethodJavadoc> <!-- 是否添加方法注释 -->
                <addParamJavadoc>true</addParamJavadoc> <!-- 是否添加参数注释 -->
                <addReturnJavadoc>true</addReturnJavadoc> <!-- 是否添加返回值注释 -->
                <addThrowsJavadoc>true</addThrowsJavadoc> <!-- 是否添加异常注释 -->
                <!-- 高级配置选项 -->
                <excludePatterns>
                    <excludePattern>.*\/generated\/.*</excludePattern> <!-- 排除生成的代码 -->
                    <excludePattern>.*Test\.java</excludePattern> <!-- 排除测试文件 -->
                </excludePatterns>
                <includePrivateMethods>false</includePrivateMethods> <!-- 是否包含私有方法 -->
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

## 项目结构

项目结构如下：

```
src/main/java/com/liyao/autofillDoc/
├── JavadocAutofillMojo.java          # 主类，Maven插件入口
├── config/
│   └── JavadocAutofillConfig.java    # 配置类，存储插件配置参数
├── exception/
│   └── JavadocProcessingException.java # 异常处理类
├── service/
│   ├── FileProcessingService.java    # 文件处理服务
│   ├── JavadocProcessor.java         # Javadoc处理器
│   └── MethodDescriptionService.java # 方法描述生成服务
└── util/
    └── JavadocUtils.java             # 工具类
```

## 新增配置选项

包含以下配置选项，可以在Maven配置中自定义：

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

### 配置选项详细说明

#### 基本配置

- **sourceDir**: 指定源代码目录，一般为`src/main/java`
- **addClassJavadoc**: 是否为类/接口/枚举添加Javadoc注释，默认为`true`
- **addMethodJavadoc**: 是否为方法添加Javadoc注释，默认为`true`
- **addParamJavadoc**: 是否为方法参数添加Javadoc注释，默认为`true`
- **addReturnJavadoc**: 是否为方法返回值添加Javadoc注释，默认为`true`
- **addThrowsJavadoc**: 是否为方法抛出的异常添加Javadoc注释，默认为`true`

#### 高级配置

- **excludePatterns**: 排除特定文件的正则表达式模式列表。插件将跳过匹配这些模式的文件，不对其进行处理。这对于排除自动生成的代码、测试文件或其他不需要文档的文件非常有用。
  - 每个`<excludePattern>`元素应包含一个有效的正则表达式
  - 文件路径将与这些模式进行匹配，匹配成功的文件将被跳过
  - 默认为空列表，即不排除任何文件

- **includePrivateMethods**: 是否为私有方法生成Javadoc注释
  - 设置为`true`时，插件将为所有方法（包括私有方法）生成注释
  - 设置为`false`时，插件将跳过私有方法，只为非私有方法生成注释
  - 默认为`true`

  
## 错误处理

提供了完整的错误处理机制，当处理文件过程中出现异常时，插件会：

1. 记录详细的错误信息到日志
2. 继续处理其他文件，不会因单个文件失败而中断整个处理过程
3. 在处理完成后提供处理成功的文件数量统计

## 注意事项

- 插件默认会为类、方法、参数、返回值和异常添加Javadoc注释
- 如果已存在注释，插件不会覆盖，只会补充缺失的部分
- 可以通过配置选项关闭不需要的注释类型
