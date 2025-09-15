---
title: "{{ replace .Name "-" " " | title }}"
date: "{{ time.Now.Format "2006-01-02 15:04:05" }}"
description: ""
type: docs
weight: 999
icon: "article"
url: "/pages/{{ substr (sha1 (printf "%s%s" .Name now)) 0 6 }}"
lastmod: "{{ time.Now.Format "2006-01-02 15:04:05" }}"
---

