# Tely's Peak Cinema Cutscene Manager

A standalone visual novel cutscene director for Foundry VTT 14. Change cinematic backgrounds and character artwork over the currently active Foundry scene. No Star Rail module, game system, or other dependency required.

## Install

For a downloaded ZIP, extract the `telys-peak-cinema-cutscene-manager` folder into your Foundry user data `Data/modules/` directory, then restart Foundry and enable it in the world.

Once this repository is published on GitHub, you can also use **Setup → Add-on Modules → Install Module** with:

```
https://raw.githubusercontent.com/Telynor/telys-peak-cinema-cutscene-manager/main/module.json
```

Enable the module in your world. The GM gets a **clapperboard** icon on the left rail: **Scene Animation Controls**. The director is also accessible through the module's settings menu.

## Two main tabs

**Current Scene** controls the cutscene players are watching. Its preview is the GM's working composition. Add actors, drag them into place, use the scaler, frame the background, then press **Push to Players**.

**Scene Library** creates and edits reusable cutscenes. Each scene has the same builder, scaler, and previewer. **Save scene** stores a preset. **Use in Current Scene** loads a new copy into the current preview. **Quick-Start copy** duplicates a preset without overwriting it. Library editing never changes the audience.

**New scene on the fly** starts a fresh composition using the viewed Foundry scene's background. You can choose the background from any existing Foundry scene without activating it, browse for another image, or paste an image path. Pan and zoom the background independently of the cast. Frames support 16:9, 21:9, and 4:3.

## What goes live immediately?

| Action in Current Scene | Behavior |
| --- | --- |
| Add or remove a character | Buffered until Push to Players |
| Character position, height, layer, visibility, entrance | Buffered until Push to Players |
| Background, framing, dialogue, introduction card | Buffered until Push to Players |
| Face, emotion, or pose variant | Immediate for characters already published in this cutscene |
| Per-character Speaking toggle | Immediate for characters already published in this cutscene |
| Master Enable/Disable Speaking effect | Immediate for the published instance of this cutscene |
| Flip Y (mirror left-to-right) | Immediate for characters already published in this cutscene |
| Any action in the Scene Library builder | Private until copied to Current Scene and pushed |

A live update changes only the relevant fields of the matching published character. It never sends the rest of the working preview, so staged additions, removals, movement, and background edits stay buffered. A newly staged character cannot appear through an expression or speaking update. Opening a different preset does not control the previous cutscene's cast until it is pushed.

The cast list has a **green Speaking / red Not speaking** toggle for every character. With the master effect enabled, red characters dim and green characters retain their normal brightness. Multiple characters can speak at once. Disabling the effect restores normal brightness for everyone and remembers the individual toggle states. Speaking is manual; this module does not use microphone detection or generate lip-sync animation.

**Flip Y** mirrors the artwork horizontally so a character faces the other direction. It does not turn them upside down.

## Actor and NPC assets

Open a character or NPC sheet as a GM and choose **Cinema Assets**. Click **Configure expressions & pose variants** to edit its library. Sheets without a conventional tab layout receive a Cinema Assets header button instead. You can also open the asset editor from the character controls in the director.

Default categories: Neutral, Talking, Happy, Sad, Laughing, Disappointment, Talk Pose 1, Talk Pose 2, and Talk Pose 3. Add custom categories as needed. Each category can contain multiple named image variants. Browse for an image or use the actor's portrait, and **Save all assets**. During a cutscene, select a variant thumbnail or **Pick random variant** from the director.

Use PNG or WebP artwork with transparency for characters. Images remain at their Foundry paths; the module does not bundle or copy your artwork. Paths must be reachable by players, including NPC art. Missing pose categories keep the current image and show a warning. Push checks image loading and asks you to correct missing paths before publishing.

## Builder and introduction tools

- Drag a character in the preview, or use X / Y controls. Coordinates use the bottom center of the artwork.
- Adjust character height from 5% to 250% of the frame. Layer controls determine which character appears in front.
- Choose fade, slide left, slide right, rise, or no entrance. Scene transitions support fades or cuts, with an adjustable duration.
- Add a dialogue speaker and text, or create a character introduction card with a name and subtitle. These are buffered composition changes.
- Save layouts to the library, duplicate them, or export/import preset JSON. Exports contain paths and actor IDs, not art files or actor sheets; other worlds need corresponding actors and assets.
- **End cutscene** removes the overlay and reveals the underlying map. It does not change, delete, or activate a Foundry scene.

## Session behavior

The cutscene is an overlay, not a destructive edit of the map's background document. Character images are separate from tokens; they do not change actor portraits, token images, or combat state. Players viewing the host scene get the published composition and can reconnect or refresh while it is live. Other viewed scenes do not display that cutscene. View the active Foundry scene to push. Changing the active Foundry scene ends the existing cutscene.

The current preview is remembered in the GM browser. Save a preset to preserve a reusable scene across browsers. Presets and actor asset libraries are world configuration; they are not a place to store secret text. Several GMs can use the tool, but should coordinate: the most recent Push determines the public composition.

## Macro access

```js
game.modules.get('telys-peak-cinema-cutscene-manager').api.open();
```

```js
await game.modules.get('telys-peak-cinema-cutscene-manager').api.stop();
```

## Development and validation

Requires Node 20+ for development only. The installed module has no runtime npm dependencies.

```sh
npm ci
npm run check
npm test
```

Automated tests cover private staging versus live field patches, rapid updates, permissions, expression variants, preset identity, DOM interactions, dimming, flipping, and audience refresh. The DOM tests use a Foundry API harness; a real Foundry 14 GM/player session remains the final integration check. Actor-sheet tabs depend on the sheet layout; the header and director asset-editor entry points remain available.

See [TESTING.md](TESTING.md) for the in-world acceptance checklist.
