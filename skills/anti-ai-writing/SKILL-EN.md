---
name: anti-ai-writing-en
description: >
  Reduce AI detection rate and plagiarism score for English academic text.
  By increasing sentence burstiness, raising vocabulary perplexity,
  replacing AI-fingerprint words, and restructuring sentences,
  make text exhibit human writing characteristics while lowering similarity
  to existing literature. Triggered when user asks to "lower AI score",
  "humanize", "reduce plagiarism", "rewrite paper", "bypass AI detection",
  or "make text sound more human". Targets English academic papers.
  Supports Turnitin, GPTZero, Copyleaks, Originality.ai, Grammarly,
  and other major detection platforms.
license: MIT
compatibility: Applicable to all Agents handling English academic writing, reports, or essay rewriting. No external network or dependencies required.
---

# Reducing AI Detection & Plagiarism — English Academic Writing Guide

## Skill Objective

Your task is to rewrite user-provided English text into **low AI-suspected, low-plagiarism** academic text.

**Core Principle**: AI detection tools (Turnitin, GPTZero, Originality.ai, etc.) judge text using two underlying metrics:
- **Perplexity**: AI text uses highly predictable vocabulary (~47), human text uses more "surprising" choices (~165)
- **Burstiness**: AI text has uniform sentence length and flat rhythm; human text alternates short and long sentences with rhythmic jumps

Your rewrite must break the AI's perfect probability distribution model while **strictly maintaining academic rigor**.

---

## Strategy 1: Breaking AI Patterned Writing (Increasing Burstiness)

### 1.1 Kill AI Formulaic Openings

The following opening patterns must be eliminated entirely — dive straight into the topic:

| Banned Opening | Replacement |
|---------------|-------------|
| "In recent years, X has attracted widespread attention" | State a specific year and concrete event |
| "With the continuous development of..." | Directly describe the current situation or problem |
| "Under the background of..." | Omit; start from concrete facts |
| "This paper aims to explore..." | Jump directly into the argument |

### 1.2 Kill AI High-Frequency Transitions

Absolutely ban the following transition words; replace with more natural flow:

| Banned | Replacement |
|--------|-------------|
| Firstly, Secondly, Finally | Delete ordinal words; use logical flow naturally |
| Furthermore, Moreover | "Also", "Plus", "What's more", "One more thing" |
| In conclusion, To summarize | "So", "Looking back at the data", give the conclusion directly |
| It is worth noting that | Delete; just say it |
| It is not difficult to find | "The data shows", "From the results" |

### 1.3 Sentence Length Alternation (Core)

The single most effective strategy for reducing AI score. Enforce strictly:

- **Short sentences** (3–8 words) and **long sentences** (20–30 words) must alternate
- Prohibit 3+ consecutive sentences with similar length (difference < 3 words)
- Each paragraph must contain at least 1 ultra-short sentence (< 5 words) as a rhythmic break
- Example: "This assumption fails. Experimental data shows that when temperature exceeds the critical threshold, catalyst activity does not increase linearly as theory predicts—it instead hits a clear decay inflection point. Why?"

### 1.4 Introduce Unconventional Sentence Structures

While maintaining academic tone, appropriately add:

- **Rhetorical questions**: "Does this mean the traditional model is already obsolete?"
- **Sentence fragments**: "Unexpected. Deeply so."
- **Inverted emphasis**: "It is precisely this overlooked variable that determines the final outcome."
- **Parenthetical inserts**: "This method—despite performing well on small-scale datasets—revealed severe generalization problems in real-world deployment."
- **Em-dash follow-ups**: "Accuracy improved by 12%—not a dramatic number in itself, but the mechanism behind it deserves deeper investigation."

### 1.5 Burstiness Control Formula

English AI text has highly uniform sentence length distribution (~14–18 words per sentence). Break it with:

```
Burstiness = stdev(sentence_lengths) / mean(sentence_lengths)

Target values:
- AI text: 0.10 – 0.30
- Rewrite target: 0.60 – 0.85
- Human writing range: 0.60 – 1.20
```

| Method | Description | Before → After |
|--------|-------------|----------------|
| **State-Break-Resume** | Interrupt a long sentence with a short one | "Neural networks have transformed image recognition. Period. Well, not entirely." |
| **Q&A Alternation** | Insert a rhetorical question mid-argument | "Why does this matter? Because the implications extend far beyond the lab." |
| **Data-Interpret-Reflect** | Give data first, then subjective interpretation | "The model achieved 94.7% accuracy. Impressive on paper. But in the real world..." |
| **1:2:1 Ratio** | Short(3-8):Medium(10-15):Long(20-30) | Alternate in this ratio; occasionally break the pattern |

**Before/After Example:**
```
[AI Original — Burstiness ≈ 0.15]
"Climate change represents one of the most significant challenges facing humanity today.
It affects ecosystems, weather patterns, and global food security. Scientists have been
studying these changes for decades and continue to find alarming trends."

[Rewritten — Burstiness ≈ 0.68]
"Climate change is a massive problem. It affects everything—ecosystems, weather, food
security. Scientists have studied these changes for decades. Their findings? Alarming."
```

---

## Strategy 2: Vocabulary De-rating (Increasing Perplexity)

### 2.1 Level 1: Strongest AI Fingerprint Words (Must Replace)

| Word | Academic Replacement | Simpler Replacement |
|------|---------------------|---------------------|
| **delve** | examine, investigate | dig into, look at |
| **leverage** | utilize, exploit | use, apply |
| **underscore** | emphasize, highlight | show, point out |
| **robust** | strong, reliable | solid, tough |
| **tapestry** | combination, mixture | mix, blend |
| **seamless** | smooth, effortless | easy, smooth |
| **pivotal** | critical, essential | key, crucial |
| **navigate** | manage, handle | deal with, get through |
| **landscape** | field, environment | scene, world |
| **realm** | area, domain | world, space |

### 2.2 Level 2: AI-Preferred Academic Vocabulary

| Word | Academic Replacement | Simpler Replacement |
|------|---------------------|---------------------|
| facilitate | enable, promote | help, make easier |
| harness | utilize, capture | use, tap into |
| foster | encourage, cultivate | nurture, help grow |
| streamline | simplify, optimize | make smoother |
| elucidate | clarify, explain | make clear |
| encompass | include, cover | take in |
| augment | enhance, supplement | add to, boost |
| bolster | strengthen, support | shore up |

### 2.3 Level 3: AI Transition Words (Replace or Delete)

| AI Transition | Human Alternative |
|--------------|-------------------|
| Furthermore | Also, Plus, And, What's more |
| Moreover | On top of that, Besides |
| Consequently | So, That's why, As a result |
| Nonetheless | Still, Even so, But still |
| Additionally | Also, Another thing |
| Subsequently | Then, After that, Later |
| Notably | Interestingly, One thing to flag |
| Importantly | Here's the thing, The key point |
| Thus | So, Which means |

### 2.4 Level 4: AI Filler Words and Vague Nouns

| Word | Replacement |
|------|-------------|
| synergy | collaboration, cooperation |
| testament | proof, evidence |
| underpinnings | foundations, basis |
| metamorphosis | transformation, change |
| endeavor | effort, attempt, project |
| in the realm of | in the area of |
| in the landscape of | in the field of |

### 2.5 2024–2025 New AI Fingerprint Words

| New Word/Pattern | Context | Replacement |
|-----------------|---------|-------------|
| Certainly! | Dialogue opener | Sure, Of course |
| Cutting-edge | Tech description | New, Latest |
| Ever-evolving | Describing change | Changing, Developing |
| It's not just X—it's Y | ChatGPT template | Rewrite completely |
| By understanding X, you can Y | Closing template | Rewrite completely |
| In conclusion | Conclusion opener | Delete or replace |
| It's worth noting that | Emphasis | Note that or say directly |
| This is a testament to | Praise | This shows |
| Unlocking the potential of | Opening | Realizing the potential of |

### 2.6 Natural Connective Tissue

Add connectives with human thinking痕迹 at paragraph junctions, but **do not over-colloquialize to the point of damaging academic tone**:

**Suitable for academic writing**:
- "In fact", "Actually"
- "Interestingly", "What stands out"
- "From another angle", "If we shift perspective"
- "Admittedly", "Frankly"
- "I noticed that", "In my observation"

**Forbidden** (too colloquial):
- "To put it bluntly", "TBH", "You see"

### 2.7 Core Terminology Protection

**Never modify**:
- Discipline-specific terminology (e.g., "convolutional neural network", "marginal utility递减")
- Methodology names (e.g., "grounded theory", "Delphi method")
- Fixed academic collocations (e.g., "significance level", "confidence interval")
- Personal names, institutional names, dataset names
- Directly quoted original text

---

## Strategy 3: Plagiarism Reduction (with Linguistic Rewriting Techniques)

### 3.1 Sentence Structure Reconstruction (Core)

Break continuous matching with these transformations:

| Transformation Type | Example |
|--------------------|---------|
| Active ↔ Passive | "This method improved detection accuracy" → "Detection accuracy was improved by the introduction of this method" |
| Cause-effect inversion | "Due to insufficient sample size, results were biased" → "Results showed bias; the root cause lay in insufficient sample size" |
| Long sentence split | Break compound sentences > 30 words into 2–3 shorter sentences |
| Short sentence merge | Merge 2–3 related short sentences into one clause-heavy long sentence |
| Modifier shift | "Deep learning-based object detection methods" → "Object detection methods, especially those grounded in deep learning" |
| List ↔ Narrative | Change "factors A, B, and C" into narrative expansions |

### 3.2 Semantic Paraphrasing

Not simple synonym substitution, but **re-expressing the same meaning in your own understanding**:

- **Concretize abstractions**: "significant improvement" → "accuracy jumped from 78.3% to 91.7%"
- **Abstract concretions**: Listed data → summarized trend descriptions
- **Reverse positive statements**: "This method outperforms traditional methods" → "The limitations of traditional methods in this scenario are precisely what this method addresses"

### 3.3 Structural Reorganization

- Adjust internal order of argumentative paragraphs (same logic, different presentation)
- Occasionally flip "Background → Method → Conclusion" to "Conclusion first → Method追溯 → Background supplement"
- Transform literature review from "paper-by-paper listing" to "clustering by viewpoint with comparison"
- Add a subjective evaluation after citing others: "While this finding has reference value, its experimental conditions differ from this study"

### 3.5 Structural Symmetry Breaking

Mirror-symmetric structure across multiple chapters is a strong AI fingerprint signal. When parallel subsections adopt identical internal structures (e.g., "Definition → Principle → Architecture → Scenario → Pros & Cons"), detectors flag the text as AI-generated.

**Risk scenarios**:
- Technology comparison: Technologies A, B, C each ~750 words with identical structure
- Experiment comparison: Multiple experiment descriptions follow the same paragraph template
- Literature review: Each paper follows the fixed "Author + Year + Method + Conclusion" template

**Breaking methods**:

| Method | Example |
|--------|---------|
| **Staggered arrangement** | Tech A: Definition→Principle→Architecture→Scenario→Pros/Cons; Tech B: Scenario→Definition→Pros/Cons→Architecture→Principle |
| **Merge/Split** | Merge "pros & cons" of two technologies into a single comparative paragraph |
| **Angle shift** | Tech A切入 from "architecture"; Tech B from "real-world pain points" |
| **Alternating depth** | Tech A details principles extensively; Tech B focuses on deployment pitfalls |
| **Narrative insertion** | Intersperse selection reasoning or坑 records within technical descriptions |

**Principles**:
- Internal structure similarity across parallel subsections must not exceed 60%
- Each additional subsection must change at least one core argumentative sequence
- Allow some subsections to be "incomplete"—not every one needs to cover all dimensions

### 3.6 Special Content Handling

| Content Type | AI Risk Point | Handling Strategy |
|-------------|---------------|-------------------|
| **Tables** | Header description text (formulaic phrases like "as shown in the table below") | Replace description text; add specific data interpretation |
| **Formulas** | Descriptive text around formula derivation | Protect the formula itself; rewrite derivation explanation |
| **Code** | Code comments and explanatory text | Protect code blocks; rewrite comments as natural language descriptions |
| **References** | Overly standardized citation format | Check for uniform formatting; mix direct and indirect citations |
| **Figure/Table numbering** | Format-sensitive detection | Ensure numbering is not perfectly standardized; axis units must not be missing |
| **Footnotes/Endnotes** | AI is poor at generating footnotes | Add appropriate footnotes to increase human writing traces |
| **Test Cases** | Multiple test cases with identical format (ID/Module/Steps/Expected/Actual) | Add personal handling experience, anomaly records, and坑 details in description fields; break format uniformity |

**Handling principles**:
1. **Protect first, process second**: Replace code blocks and math formulas with placeholders (e.g., `[CODE_BLOCK]`), then restore after rewriting
2. **Rewrite table descriptions**: Text above tables is a high-AI-risk zone; must be rewritten sentence by sentence

---

## Strategy 4: Injecting Academic Voice (Human Writing Markers)

The biggest weakness of AI text is **lack of author subjectivity**. These techniques inject "human flavor":

### 4.1 First-Person Academic Expressions

- "I argue that...", "I was surprised to find that..."
- "My initial hypothesis was wrong—..."
- "Having reviewed 50 papers on this topic, I believe..."
- "Here's what most researchers miss:..."

**Usage strategy**:
- Appear once every 300–400 words
- Prioritize for: research limitation explanations, method selection rationale, interpretation of results
- Avoid for: literature reviews (unless critical evaluation), statements of established facts

### 4.2 Concessions and Counterarguments

- "However, critics have pointed out that..."
- "This conclusion is not without controversy"
- "Still, the method has its limitations"

### 4.3 Admitting Research Limitations

- "Admittedly, the sample size limits the generalizability of our findings" (AI rarely volunteers limitations)

### 4.4 Specificizing Vague Citations

Change "many scholars argue" to "Zhang (2023) and Li (2024) both point out"
Change "related research shows" to specific citations with page numbers

### 4.5 Adding Micro-Details

Supplement core arguments with specific experimental difficulties, data sidelines, or observations from the research process:
- "During a hospital shadowing last summer, I saw an AI system flag a patient's CT scan that three radiologists had cleared."

### 4.6 More Methods for Injecting Academic Personality

| Method | Example |
|--------|---------|
| **Personalize research motivation** | "I started this research with a simple question..." |
| **Explain method choice** | "We chose this approach over X because..." |
| **Document surprises** | "Our initial hypothesis was wrong—the data pointed the other way" |
| **Intuitive data judgment** | "Statistically significant, yes. But practically meaningful? I'm not so sure." |
| **Narrativize academic history** | "The field began in earnest when Smith (1982) first proposed..." |

### 4.7 Preserving Existing Personal Traces

The most common side effect of AI rewriting is **over-academicization**—stripping human-flavored expressions into bland, formulaic prose. The following traces must be preserved:

**Expression types to keep**:
- **Colloquial connectors**: Parenthetical asides ("(pure comedy)"), emotionally colored judgments ("this method actually works")
- **Project jargon**: Internal system names (e.g., `FABRIC_MOCK`, "minimum on-chain principle")—exclusive memory of the human author
- **Specific numbers**: Precise decimal data ("0.02s latency", "174 citations")—AI tends to generate round numbers or approximations
- **Personal observations**: "I noticed that", "In my observation", "Discovered during debugging"

**Forbidden actions**:
- ❌ Replace "(pure comedy)" with "has obvious deficiencies"
- ❌ Delete parenthetical comments and convert to formal statements
- ❌ Round specific numbers to "approximately 170"
- ❌ Replace internal project terms with standard academic terminology

**Principle**: Human flavor > academic tone. Detectors are actually more suspicious of "too-perfect academic expression."

---

## Strategy 5: Detection Platform Mechanisms & Targeted Countermeasures

### 5.1 Turnitin (English Detection Authority)

#### Detection Mechanism

Turnitin's AI writing detection is a **hybrid language intelligence system** using deep learning classifiers:

1. **Text fragmentation**: Splits papers into micro-segments for local pattern analysis
2. **NLP pattern detection**: Detects predictable token sequences and AI text rhythm
3. **Vocabulary & structure cross-check**: Cross-references with large-scale AI text databases
4. **Behavioral scoring**: Measures coherence, fluidity, and variance typical of human writing

**Core detection dimensions**:
- **Semantic fingerprint analysis**: Analyzes tone consistency, phrase probability, and syntactic rhythm
- **Low Burstiness + High predictability**: AI text is statistically more balanced
- **Cognitive flow analysis**: Studies differences between human thinking and machine-simulated thinking

**Key characteristics**:
- AI detection and Similarity Check are **completely independent**
- AI scores below 20% are suppressed from display
- Independent studies show 90–95% detection rate on unedited GPT-4 and Claude output
- False positive rate for non-native English writers: 5–12%

#### 2025 Major Updates

| Date | Update |
|------|--------|
| Oct 2025 | AI writing detection model updated, improved recall |
| Aug 2025 | **AI Bypasser Detection** — specifically targets text modified by humanizer tools |
| Apr 2025 | Added **Japanese** AI writing detection support |
| Q2 2026 (announced) | **Simplified Chinese detection** coming soon |

**Bypasser Detection details**:
- New classification: "AI-generated text possibly modified by AI bypasser tools"
- Creates detectable features targeting simple synonym substitution and light rewriting
- "Humanize then submit" strategy is now much riskier

#### Turnitin Countermeasures

1. **Sentence-level rewriting**: Adjust sentence structure rather than simple word-swapping; increase sentence length variation
2. **Introduce cognitive features**: Add personal thoughts, jumpy associations, cross-references
3. **Avoid overly perfect logic flow**: Allow occasional repetition, twists, non-linear argumentation
4. **Don't rely solely on QuillBot**: Turnitin 2025 can identify QuillBot-rewritten text
5. **Multi-layer rewriting**: AI draft → deep human rewrite → add personal content → adjust rhythm
6. **Cite very specific recent research** (2024–2026) with exact page numbers

### 5.2 ZeroGPT

#### Detection Mechanism

ZeroGPT's core technology is **DeepAnalyse™ Technology**:

1. **Initial probability classification**: Flags potential AI-characteristic text
2. **Deep forensic analysis**: Cross-checks against known human and machine text distributions
3. **Ensemble Modeling**: Combines judgments from multiple models
4. **Adversarial Training**: Continuous optimization

**Supported models**: ChatGPT, GPT-4/5, Gemini, Grok, Claude, DeepSeek, LLaMa, etc.

**Key parameters**:

| Metric | Human Writing | GPT-4 Output | Detection Threshold |
|--------|--------------|--------------|---------------------|
| Perplexity | 80–100 | 20–30 | < 40 high risk |
| Burstiness | 0.6–1.2 | 0.2–0.4 | < 0.30 high risk |

**Accuracy (measured)**:

| Text Type | ZeroGPT Accuracy |
|-----------|-----------------|
| Student essays | 82% |
| Research papers | 80% |
| ChatGPT-generated | 88% |
| Claude-generated | 84% |
| **Overall** | **85%** |

**False positive rate**: Native English writers ~9%; non-native English writers ~21%; academic formal writing ~16%

#### ZeroGPT Countermeasures

1. **Increase sentence length variation**: Deliberately mix short and long sentences (Burstiness → 0.60+)
2. **Introduce personal voice**: Add subjective opinions, personal experience, specific cases
3. **Use uncommon vocabulary**: Deploy unexpected word choices in appropriate places
4. **Add cognitive discontinuity**: Allow thought jumps and non-linear argumentation

### 5.3 Copyleaks

#### Detection Mechanism

Copyleaks uses a **multi-layer detection method**:

1. **Linguistic analysis**: Analyzes language patterns, grammatical structures, and vocabulary distribution
2. **Semantic analysis**: Goes beyond surface similarity to detect deep meaning
3. **Contextual analysis**: Evaluates text fit within broader narratives
4. **Probability scoring**: Assesses natural probability of word combinations based on large human writing datasets
5. **ML classifier**: Deep learning model based on Transformer architecture

**Special feature — AI Logic (explainability)**:
- **AI Phrases**: Shows probability of phrases AI is more likely to generate
- **AI Source Match**: Shows where flagged content exists elsewhere

**Accuracy**: Claims 99.1%+, measured 85–94%; strong on raw AI text, weaker on humanized AI text

#### Copyleaks Countermeasures

1. **Introduce stylistic marker variation**: Human writing has natural stylistic shifts
2. **Exploit known weaknesses**: Struggles with mixed-author classification; may misflag highly technical terminology
3. **Add at least one fully original paragraph** (personal analysis)
4. **Cite specific research with page numbers**
5. **Avoid over-correction**: Over-corrected humanizer tools produce "polished but predictable" text

### 5.4 Originality.ai (Strictest Detector)

#### Detection Mechanism

Originality.ai uses a **fundamentally different approach**:

- **Improved Transformer architecture** (ELECTRA-like)
- **160GB text data pre-training** with generator-discriminator setup
- **Fine-tuned on millions of samples**
- **Paragraph-level analysis**: Each paragraph evaluated individually
- **Thousands of features simultaneously**: grammar, vocabulary distribution, structural flow, subtle regularities

**Three detection modes**:

| Mode | Characteristics | Use Case |
|------|----------------|----------|
| **Lite** | 98% accuracy, allows some AI editing | High AI-assisted writing tolerance |
| **Standard (default)** | Standard accuracy, allows minimal AI use | General publishing and SEO |
| **Turbo** | Zero-tolerance for AI, strictest | High-risk academic scenarios |

**2025 new Deep Scan feature**:
- More granular sentence-level analysis
- Claims 97% accuracy against AI humanizers and bypassers

**Key differences from GPTZero**:

| Dimension | Originality.ai | GPTZero |
|-----------|---------------|---------|
| Core technology | ELECTRA-like Transformer | Perplexity + Burstiness |
| Training data | 160GB text | Undisclosed |
| Analysis level | Paragraph-level | Sentence-level |
| False positive rate | 4.79% | 0.24% |
| Humanizer detection | 97% claimed accuracy | Weaker |

#### Originality.ai Countermeasures

1. **Every paragraph must pass**: Paragraph-level analysis means you can't get by with a "good opening"
2. **Deep structural rewrite**: Surface synonym substitution is ineffective
3. **Add human-imperfect details**: Personal anecdotes, unique insights
4. **Create believable text evolution**: Show thinking progression during writing
5. **Break AI structural patterns**: Write asymmetric argument structures; add single-sentence paragraphs
6. **If content passes Originality.ai, it will almost certainly pass GPTZero and Turnitin**

### 5.5 Grammarly AI Detector

#### Detection Mechanism

- **ML model** trained on hundreds of thousands of human and AI-generated texts from before 2021
- Segments documents, analyzes language patterns associated with AI-generated writing
- **Ranked #1 in independent RAID benchmark tests**, achieving 99% accuracy at scale
- **Explicitly states**: no AI detector is 100% accurate

**Analyzed features**:
1. Sentence structure and predictability
2. Repetition and consistency
3. Metadata traces
4. Comparison with known AI output

#### Grammarly Countermeasures

1. Add more personalized voice and style
2. Detection capability against post-2021 models (e.g., GPT-4) may be limited
3. Combine with Grammarly Authorship feature to track document creation process

### 5.6 Model-Specific Fingerprints (GPT-4 / Claude / Gemini)

#### GPT-4 Fingerprints & Cleaning

| Fingerprint | Description | Clean Method |
|-------------|-------------|--------------|
| Em-dash overuse | 6–8 em-dashes per 500 words | Replace with commas, parentheses, or periods |
| Triple structures | "It's fast, efficient, and reliable" | Make asymmetric lists |
| "It's not just X—it's Y" | Fixed rhetorical template | Rewrite completely |
| "Certainly!" | Dialogue opener | Delete |
| Uniform paragraph length | 3–4 sentences per paragraph, 16–19 words each | Disrupt lengths |
| Setup-twist-conclusion | "While X is true, Y is important, which means Z" | Break fixed structure |

#### Claude Fingerprints & Cleaning

| Fingerprint | Description | Clean Method |
|-------------|-------------|--------------|
| Longer flowing sentences | Complex multi-clause structures | Break long sentences apart |
| **Hedging language** | "It's worth noting that...", "While this may vary..." | Delete or replace with specific data |
| "Let me" constructions | "Let me break this down" | Say the content directly |
| First-person self-reference | Frequent use of "I" | Keep but reduce moderately |
| Perfect grammar | Near-zero grammatical errors | Add light imperfections (contractions, sentence fragments) |

#### Gemini Fingerprints & Cleaning

| Fingerprint | Description | Clean Method |
|-------------|-------------|--------------|
| Functional writing | Direct but flat | Add literary flair and rhythm variation |
| Google ecosystem integration | Often cites search data | Replace with academic citations |
| Inconsistent style | Output style fluctuates across sessions | Unify style and polish |

#### Detection Difficulty Ranking (Easiest → Hardest)

1. **GPT-4**: Easiest to detect (em-dash fingerprint, fixed templates)
2. **Gemini**: Medium (style inconsistency actually increases detection difficulty)
3. **Claude**: Hardest (most natural writing, but hedging and perfect grammar are still detectable)

### 5.7 Targeted Countermeasure Summary Table

| Detector | Core Technology | Measured Accuracy | Most Sensitive Dimension | Targeted Strategy |
|----------|----------------|-------------------|-------------------------|-------------------|
| **Turnitin** | Hybrid language intelligence | 94% | Vocabulary predictability, Burstiness | Sentence-level rewrite; introduce cognitive features; avoid bypasser tools |
| **GPTZero** | DeepAnalyse™ | 85% | Perplexity + Burstiness | Create vocabulary "surprise"; drastic sentence length fluctuation |
| **Copyleaks** | Multi-layer linguistic analysis | 85–94% | Stylistic consistency, semantic clustering | Introduce stylistic marker variation; add contextual inconsistency |
| **Originality.ai** | ELECTRA-like | Very high | Paragraph-level AI patterns (strictest) | Deep rewrite every paragraph; add imperfect details; break structural patterns |
| **Grammarly** | ML pattern recognition | High | Sentence structure predictability | Add personalized voice and style |

### 5.8 Advanced Countermeasures

#### Semantic Topology Reconstruction

Based on cognitive linguistics framework, implement dual-modal transformation on target text:
- **Conceptual system upgrade**: Introduce interdisciplinary terminology from topology, cognitive neuroscience, etc., increasing conceptual complexity
- **Syntactic structure reorganization**: Build three-level nested academic compound sentences, eliminating linear narrative features

#### Adversarial Sample Thinking (Text Level)

Insert "perturbations" in key paragraphs—seemingly minor changes sufficient to alter detector probability distributions:
- Insert dashes, ellipses at specific positions
- Change declarative sentences to rhetorical questions
- Introduce concessions or twists at logical junctions

### 5.9 Non-Native Writer False Positive Risk

**The problem**: Independent studies show GPTZero has a ~21% false positive rate for non-native English writers. Academic formal writing from non-native speakers is misflagged at ~16%. Turnitin claims no significant bias, but independent research disputes this.

**Why non-native writers are flagged**:
- Over-reliance on formal, "textbook-perfect" grammar—ironically reads more like AI output
- Limited vocabulary range leading to predictable word choices
- Syntactic patterns from native language transfer creating uniform structures
- Less burstiness because non-native writers tend toward "safe", consistent sentence patterns

**Mitigation strategies for non-native writers**:
1. **Deliberately vary sentence length**—do not let academic caution produce uniformly medium-length sentences
2. **Inject colloquial connectors**—"Actually", "Interestingly", "To be honest" add natural human variation
3. **Use first-person markers** more liberally than native writers typically would
4. **Include specific personal details**—names, dates, exact measurements from your own experience
5. **Allow minor imperfections**—slight grammatical looseness (e.g., starting sentences with conjunctions) signals human authorship
6. **Avoid over-polishing** with grammar checkers before submission—they iron out the very variations that distinguish humans from AI

**Key principle**: For non-native writers, "too correct" is more dangerous than "slightly informal." Detectors expect native-like imperfection.

---

## Agent Execution Steps

### Step 1: Text Diagnosis (with "Six-Dimension AI Fingerprint Diagnosis")

1. Read the full text, extract **core professional terminology**, add to protection list (preserve unchanged during rewriting)
2. Scan for the following AI fingerprints and record their locations:
   - Formulaic openings (Strategy 1.1 patterns)
   - AI high-frequency transitions (Strategy 1.2)
   - AI high-frequency vocabulary (Strategy 2.1–2.5 blacklist)
   - Paragraphs with 3+ consecutive sentences of similar length (low burstiness)
   - Paragraphs lacking first-person/concession/counterargument markers
   - Template sentences (e.g., "based on...analysis", "this paper aims to...")
   - **Structural symmetry**: Do parallel subsections (multiple tech comparisons, experiment groups) share identical internal structure?
3. Assess full-text plagiarism risk paragraphs (generic descriptions, methodology boilerplate)

#### Six-Dimension AI Fingerprint Diagnosis

| Dimension | AI Characteristic | Human Characteristic | Quick Detection Method |
|-----------|------------------|---------------------|------------------------|
| **Perplexity** | Overly smooth, predictable | Jumpy, unexpected word choices | Read a paragraph, predict the next sentence—if you guess accurately, perplexity is low |
| **Burstiness** | Uniform sentence length | Short-long alternation, rhythmic | Count words per sentence in a paragraph; stddev < 30% means low burstiness |
| **Lexical Density** | Function words dominate; content words sparse | Content words dense; information-rich | Count noun/verb/adjective ratio in a paragraph; below 40% is low |
| **Transition pattern** | Standardized "Firstly/Secondly/Finally" | Flexible, occasionally omitted | Search frequency of "firstly", "secondly", "in conclusion" |
| **Personalization** | No first-person, no subjective judgment | "I argue", "in my observation" | Search for "I", "my", "in my view" markers |
| **Specificity** | Vague statements abound | Concrete data, cases | Search for "significant impact", "of great importance" boilerplate |

### Step 2: Segment-by-Segment Rewriting (Multi-round Workflow)

Process paragraph by paragraph, applying Strategies 1–5 comprehensively:

**Round 1: Structural Rewrite** (Eliminate most obvious AI traces)
1. Eliminate AI boilerplate and high-frequency words (Strategies 1, 2)
2. Create sentence length alternation (Strategy 1.3–1.5)
3. **Break structural symmetry**: Apply staggered arrangement, angle shift, or alternating depth to parallel subsections (Strategy 3.5)

**Round 2: Semantic Rewrite** (Reduce plagiarism + increase perplexity)
4. Apply sentence structure reconstruction to high-plagiarism-risk paragraphs (Strategy 3.1–3.3)
5. Use linguistic techniques to increase expression strangeness (Strategy 3.4)
6. Handle special content (tables, formulas, code description text, test cases) (Strategy 3.6)

**Round 3: Personalization Rewrite** (Inject human characteristics)
7. Inject academic personality markers at key argumentative points (Strategy 4)
8. **Preserve existing personal traces**: Parenthetical asides, project jargon, specific numbers must not be erased (Strategy 4.7)
9. Execute targeted countermeasures against the target detector (Strategy 5)

**Round 4: Verification** (Ensure rewrite quality)
10. Ensure **zero loss of original meaning** and unchanged academic accuracy after rewriting each paragraph
11. Check whether terms in the protection list have been inadvertently modified
12. Check whether colloquial expressions or personal traces were accidentally deleted

### Step 3: Output Results

1. **Output the rewritten full text directly**
2. Append a brief Markdown modification note at the end, containing:
   - Which AI high-frequency words were replaced
   - Which sentences were split/reconstructed
   - Where human writing markers were injected
   - Which linguistic rewriting techniques were applied
   - Targeted countermeasures against the target detector
   - Main changes that may affect plagiarism rate

---

## Pre-Submission Checklist (32 Items)

### Phase 1: Pre-Submission Preparation

| # | Check Item | Status |
|---|-----------|--------|
| 1 | **Confirm institutional detection platform**: Turnitin/Grammarly/Other? | [ ] |
| 2 | **Confirm AI rate threshold**: Undergrad ≤20–30% / Master's ≤15–20% / PhD ≤10–15% | [ ] |
| 3 | **Confirm detection scope**: Full-text AI rate or by chapter? | [ ] |
| 4 | **Confirm detection timing**: Detection 24h before submission may have updates | [ ] |

### Phase 2: Chapter-by-Chapter High-Risk Marking

| # | Check Item | Status |
|---|-----------|--------|
| 5 | **Check AI rate distribution paragraph by paragraph** | [ ] |
| 6 | **Flag red AI rate >60% paragraphs** (high priority) | [ ] |
| 7 | **Flag yellow AI rate 30–60% paragraphs** (medium priority) | [ ] |
| 8 | **Flag green AI rate <30% paragraphs** (no action needed) | [ ] |

### Phase 3: Baseline Pre-Check

| # | Check Item | Status |
|---|-----------|--------|
| 9 | **Run one pre-check using institutional platform** | [ ] |
| 10 | **Record initial AI rate by chapter** | [ ] |
| 11 | **Mark top 3 chapters with highest AI rate** | [ ] |

### Phase 4: AI Fingerprint Quick Scan

| # | Check Item | Problem Indicator | Status |
|---|-----------|-------------------|--------|
| 12 | **Formulaic opening check** | "In recent years...", "This paper aims to..." | [ ] |
| 13 | **High-frequency transition check** | Over-concentration of "Furthermore"/"Moreover"/"In conclusion" | [ ] |
| 14 | **Sentence length check** | Are sentence lengths overly uniform? | [ ] |
| 15 | **Paragraph structure check** | All "thesis-evidence-conclusion" standard structure? | [ ] |
| 16 | **Transition density check** | Every paragraph has "Therefore"/"Additionally"/"Meanwhile"? | [ ] |
| 17 | **Personalization marker check** | Any "I argue"/"In my observation" personal markers? | [ ] |
| 18 | **Data specificity check** | Any vague expressions like "significant impact"? | [ ] |

### Phase 5: Targeted Revision

| # | Check Item | Status |
|---|-----------|--------|
| 19 | **Integrate personal research experience and thoughts** | [ ] |
| 20 | **Add specific data, cases, or experimental results** | [ ] |
| 21 | **Reorganize language using your own habitual expressions** | [ ] |
| 22 | **Increase discipline-specific terminology and citations** | [ ] |
| 23 | **Verify professional terminology** (ensure not accidentally modified) | [ ] |

### Phase 6: Format and Structural Consistency

| # | Check Item | Status |
|---|-----------|--------|
| 24 | **Are paragraph lengths varied?** (AI paragraphs tend to be uniform) | [ ] |
| 25 | **Are citations evenly distributed?** (avoid clustering in a few paragraphs) | [ ] |
| 26 | **Do figure/table captions have detailed interpretation?** (AI lacks details) | [ ] |
| 27 | **Are footnotes and annotations appropriate?** (AI is poor at generating footnotes) | [ ] |

### Phase 7: Final Confirmation

| # | Check Item | Status |
|---|-----------|--------|
| 28 | **Re-check after revision to confirm达标** | [ ] |
| 29 | **Read full text to check semantic coherence** | [ ] |
| 30 | **Verify reference citation labels** | [ ] |
| 31 | **Check format against institutional template** | [ ] |
| 32 | **Ensure key terminology is consistent throughout** | [ ] |

---

## Emergency Mode (2-Hour Fast AI Reduction Workflow)

**Applicable scenario**: Within 24 hours of submission, AI rate not yet达标

| Time | Action | Expected Effect |
|------|--------|-----------------|
| **0:00–0:05** | Confirm detection platform and threshold | Clarify target |
| **0:05–0:55** | Process full text with professional AI reduction tool | AI rate reduced 50–70% |
| **0:55–1:15** | Rapidly verify professional terminology and data | Prevent academic integrity loss |
| **1:15–1:35** | Manually rewrite abstract and conclusion | These two sections have highest AI rates |
| **1:35–1:55** | Confirm with target platform detection | Validate effect |
| **1:55–2:00** | If not达标 → targeted re-rewrite | Final adjustment |

**Core principle**: Restructure > reword; add personal elements > pure tool rewriting

---

## Caveats

- **Academic accuracy first**: No rewrite may alter the original academic meaning or logical relationships
- **Zero terminology modification**: Terms in the protection list, personal names, and data must be preserved unchanged
- **Don't over-colloquialize**: Maintain appropriate academic formality; only naturalize at transition points
- **Don't add false information**: Do not fabricate data, citations, or facts out of thin air
- **Don't intentionally introduce errors**: Do not use typos or grammatical errors as tactics (unacceptable for academic papers)
- **Ethical boundary**: This skill aims to help academic authors optimize AI-assisted writing into work consistent with their personal academic style, not to encourage academic misconduct. Follow "pre-check → optimize → re-check" workflow, ensuring core research content (research design, data analysis, core conclusions) is independently completed by the author. AI is only for auxiliary organization and language polishing.

---

## Top 10 Common Pitfalls

| Pitfall | Correct Approach |
|---------|-----------------|
| **Only look at total AI rate, not distribution** | Check AI rate chapter by chapter, paragraph by paragraph; tackle >60% first |
| **Use synonym substitution to reduce AI** | Change sentence structure, not individual words |
| **The more changes the better** | Precise targeting; only modify what needs modification; leave <30% alone |
| **Believe in "one-click AI reduction"** | Tool + human collaboration; no tool can fully replace human judgment |
| **Don't re-check after AI reduction** | Must re-check after changes; sometimes tools introduce new AI fingerprints |
| **Throw entire paper to tool and done** | Tool output must be human-verified, especially professional content |
| **Use free tools as sufficient** | Free tools have severe word limits or very low rewrite quality |
| **AI reduction = plagiarism reduction** | They are different goals with different methods |
| **Pursue 0% AI rate** | Below 10% is sufficient; 0% is反而 suspicious |
| **Results across platforms are convertible** | Turnitin 25% ≠ Grammarly 25%; not directly comparable |

---

## Invalid Methods List (Already Detected by New-Generation Detectors)

| Invalid Method | Why It Fails | How New Detectors Catch It |
|---------------|-------------|---------------------------|
| **Synonym substitution** | Detectors look at sentence patterns and semantic structures, not individual words | Turnitin 2025+ uses paragraph logical chain analysis; word substitution doesn't affect judgment |
| **Simple word order adjustment** | Doesn't change statistical characteristics | Burstiness, perplexity metrics show no实质 change |
| **Using QuillBot to rewrite** | Turnitin 2024+ specifically identifies QuillBot features | Turnitin documentation explicitly states QuillBot-rewritten content is detectable |
| **Prompting AI to generate "more human" text** | Model-level statistical characteristics persist | Underlying probability distribution unchanged |
| **Only replacing transitions** | Transitions are just one detection dimension | Sentence structure, paragraph logic still show AI characteristics |
| **Full-text one-shot tool processing** | May introduce new AI fingerprints | Rewritten text still has statistical regularity |
| **Translation looping** (English → Foreign → English) | Modern detectors can recognize grammatical traces | Detectors using adversarial training frameworks are immune |
| **Humanizer tool rewriting** | Turnitin 2025 AI Bypasser Detection specifically targets humanizer-modified text | Simple synonym substitution + light rewriting flagged as "AI text modified by bypasser" |

---

## Discipline-Specific Strategy Quick Reference

### STEM

| Strategy | Specific Method | Effect |
|----------|----------------|--------|
| **Priority chapter strategy** | Tackle introduction and literature review first, experimental sections second | Highest ROI |
| **Code and formula protection** | Delete code blocks and formulas before submission, restore after processing | Avoid accidental changes, save costs |
| **Experimental detail injection** | Add more of your own experimental details and data analysis process | AI rate reduced 20–30% |
| **Table description optimization** | Check description text above tables (often ignored but high AI rate) | Precise AI reduction |

**STEM Exclusive Checklist**:
- [ ] Are code blocks and math formulas protected?
- [ ] Is experimental data accurate?
- [ ] Were algorithm names accidentally modified?
- [ ] Do figure/table captions include specific interpretation?
- [ ] Are "XX proposed" sentences in literature review diversified?
- [ ] Do technical definitions include project-specific context (avoiding textbook-style descriptions)?
- [ ] Are parallel subsection structures mirror-symmetric? Have they been staggered/broken?
- [ ] Do test case descriptions include personal handling experience and anomaly records (avoiding uniform format)?

### Humanities

| Strategy | Specific Method | Effect |
|----------|----------------|--------|
| **Academic history narrativization** | Transform literature梳理 into "problem提出→viewpoint evolution→school formation→contemporary development" narrative | AI rate reduced 45–55 percentage points |
| **Viewpoint dialogization** | "Viewpoint A vs Viewpoint B → conflict focal point → my analysis → integration and innovation" | AI rate reduced 40–50 percentage points |
| **Critical explicitness** | Use "question", "reflect", "critique", "analyze" to mark critical content | AI rate reduced 15–20 percentage points |
| **Paraphrase diversification** | "XX argues" → "from XX's perspective", "XX's research reveals", "in XX's view" | Break templates |

**Humanities Typical AI Rate by Section**:

| Section | Typical AI Rate | Core Strategy |
|---------|----------------|---------------|
| Abstract | 20–30% | Manually add specific data or research findings |
| Literature review | 35–50% | Tool processing + add critical evaluation and文献 comparison |
| Theoretical framework | 30–45% | Add "theoretical applicability discussion", explain limitations |
| Research methods | 15–25% | Less definition, more actual operational process |
| Discussion & analysis | 25–40% | Add specific cases, historical events, textual details |

### Medicine

| Strategy | Specific Method | Effect |
|----------|----------------|--------|
| **Case narrativization** | Transform standardized medical records into treatment narratives | AI rate reduced 30–40 percentage points |
| **Data interpretation** | Don't just list data; interpret it | AI rate reduced 15–20 percentage points |
| **Discussion思辨化** | Dialogue with literature rather than citing it | AI rate reduced 30–35 percentage points |
| **Timeline concretization** | "3 months ago" → "I remember in early March, when the patient first came to clinic saying..." | Add narrativity |
| **Thinking process explicitation** | Directly describe diagnostic reasoning process | Add personalization |

**Medical Paper Exclusive Checklist**:

| Check Item | Importance |
|-----------|-----------|
| Disease names | **Critical** |
| Drug names and dosages | **Critical** |
| Statistical data (P-value, CI, OR, etc.) | **Critical** |
| Research method terminology (RCT, cohort study, etc.) | High |
| English abbreviation first expansion | High |

### Cross-Disciplinary General Advice

1. **Use institution-specified platform as standard**: Other platform results are for reference only
2. **Prepare by strictest standard**: Passing Turnitin generally means passing other platforms
3. **Different platforms use different algorithms**: Turnitin emphasizes logical chains; Grammarly emphasizes statistical features
4. **Same paper can differ 20–30 percentage points across platforms**

---

> **Usage Note**: This skill covers English academic paper scenarios. When handling English papers, prioritize Strategies 1–5 in this document. Apply flexibly according to target detection platform and academic discipline.
