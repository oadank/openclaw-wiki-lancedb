---
title: "Google Secret Manager"
category: "litellm-secrets"
tags:
  - litellm
  - litellm-secrets
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/secret_managers/google_secret_manager.md"
summary: ":::info"
---

# Google Secret Manager

# Google Secret Manager

#### ℹ️ Info

✨ **This is an Enterprise Feature**

[Enterprise Pricing](https://www.litellm.ai/#pricing)

[Contact us here to get a free trial](https://enterprise.litellm.ai/demo)



Support for [Google Secret Manager](https://cloud.google.com/security/products/secret-manager)

1. Save Google Secret Manager details in your environment

```shell 
GOOGLE_SECRET_MANAGER_PROJECT_ID="your-project-id-on-gcp" # example: adroit-crow-413218
```

Optional Params

```shell
```

2. Add to proxy config.yaml 
```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      api_key: os.environ/OPENAI_API_KEY # this will be read from Google Secret Manager

general_settings:
  key_management_system: "google_secret_manager"
```

You can now test this by starting your proxy: 
```bash
litellm --config /path/to/config.yaml
```

[Quick Test Proxy](../proxy/quick_start#using-litellm-proxy---curl-request-openai-package-langchain-langchain-js)
