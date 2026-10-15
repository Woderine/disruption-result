# Gaxy: causal online disruption prediction, recent-400 no-Br model

This directory contains per-shot result figures for online predictions made before shot 19000. The figures show measured IP (kA), measured ZP (m), and the model output over time. The horizontal line is the causal alarm threshold in force for that shot; a red vertical line marks the first alarm. For high-risk shots, the event time and its 15 ms early-warning deadline are **post-hoc reference annotations**, not model inputs.

## Experiment scope

- Model: no-Br fixed-channel tree model, retrained after each completed shot using up to the most recent 400 eligible shots; no fixed early-shot anchor. Tree count was selected using a fixed 15% shot-level validation split, followed by 100 additional trees in the full-shot refit.
- First 400 usable shots (12565–13867) initialized the online model and have no online test prediction in this set.
- These 1825 figures cover all saved online predictions with shot number below 19000, from shot 13868 through shot 18366. There are no further online predictions between 18366 and 18999 in this run. Missing or unavailable shots were **not** imputed or presented as predictions.
- The run used only continuous `hazard_score` for target construction; legacy `label` and `vde_label` were not read. Its event anchor was `disruption_time`.
- Evaluation bands: score <= 0.15 is low risk; score >= 0.65 is high risk; intermediate-score shots were inferred and trained on but excluded from binary TPR/FPR. A high-risk shot counts as timely only if the first alarm is at least 15 ms before the event.

## Aggregate result for these 1825 online shots

| Group | Count | Result |
| --- | ---: | --- |
| High risk | 841 | 677 timely alarms, 94 late alarms, 70 without alarm; timely TPR 80.50% |
| Low risk | 429 | 72 false alarms, 357 true negatives; FPR 16.78% |
| Intermediate | 555 | 294 alarms, 261 without alarm; not included in binary rates |

The per-shot `TP`, `TD`, `TN`, `FP`, `MA`, and `MIDDLE_*` statuses printed in the figures are post-hoc evaluations. They must not be interpreted as information available to the model during a discharge. This directory contains figures and explanation only, not original diagnostic H5 files, probability arrays, or training code.
