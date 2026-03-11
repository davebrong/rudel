# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: Redesign Chart Hover Tooltips

## Context
Chart tooltips are currently too large and visually noisy. The recharts default renders item names in colored text, which is hard to read. The desired design (per screenshot) shows:
- Date header at the top (bold)
- Colored circle dot per item + label in black + value right-aligned
- Smaller font and tighter line spacing
- Total row at the bottom separated by a divider

## Approach

### 1. Create shared `ChartToolti...

### Prompt 2

What is the logic for sorting the legend on the right of the charts with dimensional splits?

### Prompt 3

ok thanks for the info before we change anything there we need to also add the new hover format we just implemtend to the chart in the Multi-Dimensional Analysis - if you select a 2nd dimension/split i can still see the old format when hovering.

### Prompt 4

Ok now i would like to make the sorting of the legend on the right side always consistent across the whole app. At the top we should have the item with the highest sum of the metric that is picked. Make sure this is the case across all charts and it's consistent. Also make sure that the colors remain the same when a new metric is picked.

### Prompt 5

[Request interrupted by user for tool use]

