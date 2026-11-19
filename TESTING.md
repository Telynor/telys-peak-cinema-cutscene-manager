# Foundry 14 acceptance check

Run in a test world with one GM browser and one player browser on the active scene.

1. Enable the module without any other Tely modules. Click the left-rail clapperboard. Verify Current Scene and Scene Library open.
2. Open both a character and NPC sheet. Configure neutral, happy (two variants), and talking artwork in Cinema Assets. Save and reopen to check persistence.
3. Create a scene on the fly. Select another existing Foundry scene as the background source. Verify that the active Foundry scene does not change.
4. Add two actors; drag and scale both in the preview. Verify that players still see the map. Push to Players. Compare placement and framing on GM/player displays with different window sizes.
5. Move one actor, change the background, add a third actor, and remove the second actor in preview without pushing.
6. Change the first actor's emotion and select both variants. Verify that the player receives the changed face while the original background and cast remain visible in their original positions.
7. Enable Speaking. Toggle the first actor green then red; verify full brightness then dimming. Toggle multiple characters green. Disable the master effect; verify all artwork returns to normal. Enable it again; verify the previous toggle states return.
8. Flip Y on the first actor. Verify it mirrors immediately on the player screen and still does not publish the staged composition.
9. Push. Verify all queued cast, background, position, and scale changes appear together.
10. Save a preset. Edit it in Scene Library with its own builder/scaler/previewer. Verify no library action affects the live display. Save it; Quick-Start a copy. Verify the original preset is intact.
11. Add an introduction card and dialogue, then push. Clear the introduction and push. Test cut and fade transitions and entrances.
12. Refresh the player browser during the cutscene; verify reconstruction. Refresh or reopen the GM director; verify the local preview is restored.
13. End cutscene. Verify the underlying map and tokens remain intact. Activate a different Foundry scene while live; verify the old cutscene does not carry over.
14. Export/import presets and check the imported copies. Verify asset paths and actor associations are accessible in the target world.
15. Test rapid emotion, flip, and speaking toggles. Verify no earlier image reappears and no state is lost.
16. Try a missing image path; verify Push is blocked with a useful warning. Players should not receive GM controls.
