---
title: "🔭 DeepEval - Open-Source Evals with Tracing"
category: "litellm-observability"
tags:
  - litellm
  - litellm-observability
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/observability/deepeval_integration.md"
summary: "[DeepEval](https://deepeval.com) is an open-source evaluation framework for LLMs ([Github](https://github.com/confident-ai/deepeval)). "
---

# 🔭 DeepEval - Open-Source Evals with Tracing


# 🔭 DeepEval - Open-Source Evals with Tracing

### What is DeepEval?
[DeepEval](https://deepeval.com) is an open-source evaluation framework for LLMs ([Github](https://github.com/confident-ai/deepeval)). 

### What is Confident AI?

[Confident AI](https://documentation.confident-ai.com) (the ***deepeval*** platfrom) offers an Observatory for teams to trace and monitor LLM applications. Think Datadog for LLM apps. The observatory allows you to:

- Detect and debug issues in your LLM applications in real-time
- Search and analyze historical generation data with powerful filters
- Collect human feedback on model responses
- Run evaluations to measure and improve performance
- Track costs and latency to optimize resource usage


### Quickstart

```python


os.environ['OPENAI_API_KEY']='<your-openai-api-key>'
os.environ['CONFIDENT_API_KEY']='<your-confident-api-key>'

litellm.success_callback = ["deepeval"]
litellm.failure_callback = ["deepeval"]

try:
    response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "What's the weather like in San Francisco?"}
        ],
    )
except Exception as e:
    print(e)

print(response)
```

#### ℹ️ Info
You can obtain your `CONFIDENT_API_KEY` by logging into [Confident AI](https://app.confident-ai.com/project) platform. 


## Support & Talk with Deepeval team
- [Confident AI Docs 📝](https://documentation.confident-ai.com)
- [Platform 🚀](https://confident-ai.com)
- [Community Discord 💭](https://discord.gg/wuPM9dRgDw)
- Support ✉️ support@confident-ai.com
