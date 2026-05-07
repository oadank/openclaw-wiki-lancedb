---
title: "✨ IP Address Filtering"
category: "litellm-proxy"
tags:
  - litellm
  - litellm-proxy
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/proxy/ip_address.md"
summary: ":::info"
---

# ✨ IP Address Filtering


# ✨ IP Address Filtering

#### ℹ️ Info

You need a LiteLLM License to unlock this feature. [Grab time](https://enterprise.litellm.ai/demo), to get one today!



Restrict which IP's can call the proxy endpoints.

```yaml
general_settings:
  allowed_ips: ["192.168.1.1"]
```

**Expected Response** (if IP not listed)

```bash
{
    "error": {
        "message": "Access forbidden: IP address not allowed.",
        "type": "auth_error",
        "param": "None",
        "code": 403
    }
}
```
