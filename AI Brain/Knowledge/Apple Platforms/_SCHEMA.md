# Knowledge Entry Schema

Every durable technical page should carry or imply:

```yaml
topic: String
category: swift | swiftui | shader | metal | performance | tooling
status: SHIPPING | BETA | PROPOSED | COMMUNITY | DEPRECATED | SUPERSEDED
verified: YYYY-MM-DD
minimum_os: optional
minimum_xcode: optional
confidence: primary-source-verified | mixed | exploratory
```

Each page should answer:
- What changed?
- When should an agent use it?
- When should an agent avoid it?
- What are the deployment constraints?
- What are the performance implications?
- What should be measured?
- What primary sources prove it?
- What action items does it imply?
