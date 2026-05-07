---
title: "AWS Key Management V1"
category: "litellm-secrets"
tags:
  - litellm
  - litellm-secrets
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/secret_managers/aws_kms.md"
summary: ":::info"
---

# AWS Key Management V1

# AWS Key Management V1

#### ℹ️ Info

✨ **This is an Enterprise Feature**

[Enterprise Pricing](https://www.litellm.ai/#pricing)

[Contact us here to get a free trial](https://enterprise.litellm.ai/demo)



#### 💡 Tip

[BETA] AWS Key Management v2 is on the enterprise tier. Go [here for docs](../enterprise.md#beta-aws-key-manager---key-decryption)



Use AWS KMS to storing a hashed copy of your Proxy Master Key in the environment. 

```bash
```

```yaml
general_settings:
  key_management_system: "aws_kms"
  key_management_settings:
    hosted_keys: ["LITELLM_MASTER_KEY"] # 👈 WHICH KEYS ARE STORED ON KMS
```

[**See Decryption Code**](https://github.com/BerriAI/litellm/blob/a2da2a8f168d45648b61279d4795d647d94f90c9/litellm/utils.py#L10182)
