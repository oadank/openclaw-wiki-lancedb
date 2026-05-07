---
title: "Google Key Management Service"
category: "litellm-secrets"
tags:
  - litellm
  - litellm-secrets
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/secret_managers/google_kms.md"
summary: ":::info"
---

# Google Key Management Service

# Google Key Management Service

#### ℹ️ Info

✨ **This is an Enterprise Feature**

[Enterprise Pricing](https://www.litellm.ai/#pricing)

[Contact us here to get a free trial](https://enterprise.litellm.ai/demo)



Use encrypted keys from Google KMS on the proxy

Step 1. Add keys to env 
```
```

Step 2: Update Config

```yaml
general_settings:
  key_management_system: "google_kms"
  database_url: "os.environ/PROXY_DATABASE_URL_ENCRYPTED"
  master_key: sk-1234
```

Step 3: Start + test proxy

```
$ litellm --config /path/to/config.yaml
```

And in another terminal
```
$ litellm --test 
```

[Quick Test Proxy](../proxy/user_keys)
