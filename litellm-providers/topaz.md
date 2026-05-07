---
title: "Topaz"
category: "litellm-providers"
tags:
  - litellm
  - litellm-providers
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/providers/topaz.md"
summary: "| Property | Details |"
---

# Topaz

# Topaz

| Property | Details |
|-------|-------|
| Description | Professional-grade photo and video editing powered by AI. |
| Provider Route on LiteLLM | `topaz/` |
| Provider Doc | [Topaz ↗](https://www.topazlabs.com/enhance-api) |
| API Endpoint for Provider | https://api.topazlabs.com |
| Supported OpenAI Endpoints | `/image/variations` |


## Quick Start

```python
from litellm import image_variation

os.environ["TOPAZ_API_KEY"] = ""
response = image_variation(
    model="topaz/Standard V2", image=image_url
)
```

## Supported OpenAI Params

- `response_format`
- `size` (widthxheight)
