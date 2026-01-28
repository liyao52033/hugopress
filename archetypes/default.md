<!-- ---
title: "{{ replace .Name "-" " " | title }}"
date: "{{ time.Now.Format "2006-01-02 15:04:05" }}"
description: ""
icon: "article"
url: "/pages/{{ substr (sha1 (printf "%s%s" .Name now)) 0 6 }}"
tags:
  -
categories:
  - 
author:
  name: liyao
  link: https://xiaoying.org.cn
weight: 999
type: docs
---

 -->
