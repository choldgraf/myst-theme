---
title: Controlling Cell Behavior
jupyter:
  kernelspec:
    display_name: Python 3
    language: python
    name: python3
---

# Controlling Cell Behavior

MyST supports several tags to control the visibility and behavior of code cells and their outputs. These tags can be added to cell metadata in Jupyter notebooks or via the `:tags:` option in MyST Markdown code cells.

## Cell visibility tags

### Hide input (collapsible)

The `hide-input` tag creates a collapsible section for the code, allowing readers to expand it if needed:

```{code-cell}
:tags: [hide-input]

import numpy as np
import matplotlib.pyplot as plt

# This code is hidden by default but can be expanded
x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
```

### Remove input

The `remove-input` tag completely removes the code cell from the output, showing only the result:

```{code-cell}
:tags: [remove-input]

import pandas as pd

# This code will not be visible at all
data = {'Name': ['Alice', 'Bob', 'Charlie'], 'Score': [95, 87, 92]}
df = pd.DataFrame(data)
df
```

### Hide output (collapsible)

The `hide-output` tag creates a collapsible section for the output:

```{code-cell}
:tags: [hide-output]

# The output is hidden by default but can be expanded
for i in range(20):
    print(f"Output line {i}")
```

### Remove output

The `remove-output` tag completely removes the output from display:

```{code-cell}
:tags: [remove-output]

# This cell's output will not be shown
result = 42 * 2
print(f"The answer is {result}")
```

### Long output with scrolling

The `scroll-output` tag limits the height of long outputs with a scrollbar:

```{code-cell}
:tags: [scroll-output]

# Generate long output to demonstrate scrolling
for i in range(50):
    print(f"This is output line {i}")
    print(f"  - With some additional details on line {i}")
```

## Stream filtering tags

### Remove stderr

The `remove-stderr` tag filters out error/warning messages while keeping standard output:

```{code-cell}
:tags: [remove-stderr]

import sys

print("This goes to stdout and will be visible")
print("Important calculation result: 42", file=sys.stderr)  # This will be hidden
```

### Remove stdout

The `remove-stdout` tag filters out standard output while keeping error messages:

```{code-cell}
:tags: [remove-stdout]

import sys

print("This goes to stdout and will be hidden")
print("Warning: This is an error message", file=sys.stderr)  # This will be visible
```

## Complete cell visibility

### Hide cell (collapsible)

The `hide-cell` tag hides both the input and output in a collapsible section:

```{code-cell}
:tags: [hide-cell]

# Both this code and its output are hidden by default
x = [1, 2, 3, 4, 5]
print(f"Sum: {sum(x)}")
print(f"Average: {sum(x)/len(x)}")
```

### Remove cell

The `remove-cell` tag completely removes the entire cell from display:

```{code-cell}
:tags: [remove-cell]

# This entire cell (code and output) will not be visible
secret_calculation = 123 * 456
print(f"Secret: {secret_calculation}")
```

## Combining tags

You can combine multiple tags for more control:

```{code-cell}
:tags: [hide-input, remove-stderr]

import sys

# Code is hidden (collapsible), and stderr is removed
print("This output will be shown")
print("This warning will be hidden", file=sys.stderr)
result = sum(range(10))
print(f"Result: {result}")
```

## Tag reference

| Tag | Level | Effect |
|-----|-------|--------|
| `hide-input` | Code | Hides code in collapsible section |
| `remove-input` | Code | Completely removes code from display |
| `hide-output` | Output | Hides output in collapsible section |
| `remove-output` | Output | Completely removes output from display |
| `scroll-output` | Output | Limits output height with scrollbar |
| `hide-cell` | Cell | Hides entire cell in collapsible section |
| `remove-cell` | Cell | Completely removes entire cell |
| `remove-stderr` | Stream | Filters stderr from output |
| `remove-stdout` | Stream | Filters stdout from output |
