# Flow Video Kit

The style, characters and ingredients behind the AI clips of the October 2026
plugin demo, kept for the next demo video. The clips were made in Google Flow
with Gemini Omni Flash (Veo); real terminal output came from VHS screen
recordings, never from AI. How those are made is the repo skill
[record-skill-demo](../../../.claude/skills/record-skill-demo/SKILL.md). Every
scene prompt of the October films, voice-over included, is in
[flow-prompts.md](../2026-10-plugin-demo/flow-prompts.md).

## Workflow in Flow

1. **Create the ingredients once** (see [Ingredients](#ingredients)). Images:
   switch **Agent** off, click the model name and choose **Image**. Save
   `HOST`, `CAT`, `AGENT` and `BOARD` as characters and `WORKSHOP` as an image.
   The voice is made separately, see [VOICE](#voice--host-and-narrator).
2. **Generate every scene on its own**: Agent off, model name → **Omni Flash**
   → **Video** → **Ingredients**. Add the scene's ingredients with **Add**,
   paste the full prompt, set the duration and generate 2–4 variations. If a
   pasted `@NAME` does not link, type `@` at that spot and pick the ingredient.
   The voice only works in this mode.
3. **Build each scene prompt in four parts**: the character block (only who is
   in the shot), the scene, the spoken line or voice-over, and the style block.

Pasting a whole script into **Flow Agent** to generate every scene in one batch
returned unusable clips. Paste scene by scene.

## Style Block

Append to every scene prompt.

```text
Style: glossy stylized 3D animation in a miniature diorama world, tilt-shift depth of field, punchy saturated colors, neon rim light in electric violet and hot coral, dramatic lens flares, floating sparkles and confetti bursts on big moments. Dynamic camera: whip pans, crash zooms, speed ramps into slow motion. 16:9.
Audio: bold sound effects and ambience, no music. No speech unless a quoted line is given.
Constraints: no subtitles, no watermark, no logos. Spoken lines are audio only, never shown as text. No on-screen text except where an object is said to read a quoted text.
```

Music goes in during the edit: one track under everything, ducked under speech.
Generated music changes at every cut.

## Character Block

Start every scene prompt with the sentences for the ingredients in that shot,
and only those.

```text
@HOST is the host: a woman with long curly hair, an electric-violet blazer and hot coral sneakers.
@AGENT is a small floating sphere of warm coral-red light, about the size of a fist, with a soft halo. It has no face, no arms, no hands and no body. It is not a person, never turns into one and never merges with anyone. It moves objects only by drawing them into its glow or with thin beams of light.
@CAT is the host's mega fluffy seal point Ragdoll kitten, with no collar, no clothing and no accessories.
@BOARD is a cork sprint board on a wooden stand, divided into three columns by thin violet tape, covered with small blank paper cards, with a brass lever on its side.
The setting is @WORKSHOP: a cozy developer workshop diorama with a desk, a laptop and a pegboard wall of glowing violet cards.
All speech uses the voice @VOICE.
```

Spoken lines then follow one of two forms:

- On screen, lip-synced: `She looks into the camera and says: "…" She speaks
  Dutch with the voice @VOICE.`
- Off screen: `Voice-over in Dutch by an off-screen narrator with the voice
  @VOICE, not spoken by anyone on screen: "…"` — the "not spoken by anyone on
  screen" stops the host from lip-syncing the narrator.

## Ingredients

### HOST — the presenter

Upload a photo of the presenter as the reference and let Flow turn it into a
stylized character sheet. Fill in the placeholders.

```text
Use the uploaded photo as the reference for face and hair. Character reference sheet, front view and three-quarter view: a woman of about 45 with long, voluminous curly [hair color] hair, [glasses: describe or "no glasses"], confident and playful expression. She wears a sharp electric-violet blazer over a black T-shirt and hot coral sneakers. Glossy stylized 3D animation that keeps her likeness. Plain warm off-white background.
```

A stylized version of a real face held up better across clips than a
photorealistic one.

### CAT — the host's cat

A running gag, at least once per film. She is stubborn and looks rather dim,
but notices more than you think. She never sits on a shoulder; at most on a
lap, and then mostly when it is inconvenient. Otherwise she lies across the
keyboard, sees prey in a cable or chews a plant. No clothes, no hats.

```text
Character reference sheet, front view, side view and three-quarter view: a mega fluffy seal point Ragdoll kitten. Long, silky cream-white fur with dark seal-brown points on the ears, the face mask, the legs and a huge plume of a tail, a big fluffy ruff around the neck, and large deep sapphire-blue eyes. A slightly dim, stubborn look, but with sharp, knowing eyes. No collar, no clothing, no accessories. Glossy stylized 3D animation, plain warm off-white background.
```

### AGENT — Claude as an agent

```text
A small floating companion made of warm coral-red light: a smooth glowing sphere the size of a fist, with a soft halo and a faint swirling glow inside. No face, no limbs. It leaves a thin sparkling trail when it moves. Glossy stylized 3D animation, plain warm off-white background.
```

### BOARD — the sprint board

```text
A large cork sprint board on a wooden stand, divided into three columns by thin violet tape and covered with small blank paper cards in neat rows, each held by a tiny colored pin. A brass lever is mounted on its right side. No text anywhere. Glossy stylized 3D animation, plain warm off-white background.
```

### WORKSHOP — the setting

```text
A cozy modern developer workshop at dusk, shown as a miniature diorama: a wooden desk with a laptop and a mechanical keyboard, a large window with distant city lights, and on the back wall a tall pegboard holding dozens of small glowing cards in neat rows, each a slightly different shade of violet. Warm desk lamp, violet neon ambient light. Glossy stylized 3D animation.
```

### VOICE — host and narrator

One voice for both the host on screen and the narrator off screen. Flow cannot
take an uploaded recording; a voice is built on one of Flow's base voices.

1. Model name → **Omni Flash** → **Video** → **Ingredients**.
2. **Add** → **Voices** → **Create New Voice**.
3. Pick a female base voice, name it `VOICE`, and set "Voice Performance" to:

   ```text
   A warm, confident woman in her mid-forties, playful and energetic, with natural Dutch pronunciation and clear articulation. A smile in the voice.
   ```

4. Type a sample line from the script (for example "Eén plugin. Achtendertig
   skills. Nul excuses."), click **Sync**, listen, and **Save New Voice**.

The presenter's own voice is out of reach in Flow: the avatar (`@me`) records
it, but is not available in the EEA. To use your own voice, clone it outside
Flow, leave the voice-over line out of the prompt and lay the VO under the clip
in the edit.

## Lessons From the October 2026 Demo

| What went wrong | What fixed it |
| --- | --- |
| A batch of scenes through Flow Agent came back as junk | Paste one complete prompt per scene, Agent off |
| `AGENT` turned into a person or merged with the host when it "handed" or "held" something | The AGENT sentence in the character block, in every prompt; objects float by themselves, into its glow or along a beam of light |
| "Flags" rendered as country flags | Blank coral sticky notes for review findings; for boats, a lantern at the top of the mast that changes colour, plus "no flags" |
| Cards rendered as playing cards | Task cards as "plain paper task cards, like blank index cards"; poker cards as "plain white cards that each show only one large number, "3", "5" and "8", and nothing else: no suits, no hearts, no spades, no clubs, no diamonds, no faces, no pictures" |
| A metaphor world (a turntable with stations, a restaurant kitchen, a toy railway) made the story harder to follow | Show the real thing: the workshop, the board, the laptop and the agent |
| The cat wore a matching hat when the host wore one | "No collar, no clothing and no accessories" in the CAT sentence |

Limits and habits that held up:

- **Duration:** Omni Flash clips run up to 10 seconds.
- **Speech length:** a lip-synced line fits at most about 12 words; a
  voice-over about 18 words per 8 seconds. Longer lines get rushed or cut.
- **Pronunciation:** write a word the way it should sound — "loep" for the
  English *loop*, "A.I." for AI.
- **On-screen text:** only put text in quotes ("The card reads "create-pr"");
  if it still comes out garbled, generate without it and add the label in the
  edit. Logos are excluded by the style block, so a product name on screen
  (GitLab, Jira) is also a label in the edit.
- **Ingredients per clip:** keep it to three visual ingredients plus the voice
  where you can. Whether Flow accepts four is untested; when it refuses, drop
  the setting (`WORKSHOP`) first, since the prompt describes it anyway.
- **A new variation is also a new take of the voice:** pick the clip where both
  picture and speech work.
