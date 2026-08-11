# Creative Frontend Engine — Project Spec

## What it is

The Creative Frontend Engine is an AI-assisted creative direction system for vibe-coded websites. It helps transform generic AI-generated frontend designs into visually distinctive, product-relevant, cinematic, and dynamic interfaces.

It is not a prompt-to-website generator. It is a structured creative pipeline that uses product context, reference analysis, and specialized agents to produce intentional design directions before implementation.

## Why we are building it

Vibe-coded UIs often look interchangeable: safe layouts, default typography, and decorative patterns that ignore the product. The Engine exists to:

- Ground creative decisions in what the product actually is and who it serves
- Generate multiple coherent creative directions before committing to code
- Keep visual quality high through critique and iteration after rendering
- Separate possibility-generation from direction-setting so the product, not the model, leads

## Eventual pipeline

```
Project Input
→ Product Understanding
→ Reference Analysis
→ Creative Brief / Design Genome
→ 4 Creative Directions
→ User Selection
→ Asset Generation
→ Frontend Implementation
→ Motion
→ Browser Rendering
→ Visual Critique
→ Iteration
```

This pipeline is the long-term product vision. It is **not** implemented in Milestone 01.

## Core principles

### AI generates possibilities; product context determines direction

Models are good at producing options. They are not allowed to invent a brand voice or visual system in a vacuum. Product understanding — audience, category, constraints, and intent — selects and shapes which possibilities become the design direction.

### Analyze visual references for principles, do not copy them

References inform composition, rhythm, contrast, material, and motion principles. They are not templates to clone. Output should feel original and product-specific, not derivative of a scraped moodboard.

## Milestone 01 scope

Project foundation only:

- Next.js (App Router), TypeScript, Tailwind CSS, ESLint, Zod
- Folder structure and documentation
- Minimal non-functional dashboard shell
- Environment variable template

No AI integrations, authentication, database, asset generation, Figma, or motion libraries in this milestone.
