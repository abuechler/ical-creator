# Project Notes

## CSS Centering Techniques

Reference: https://www.w3.org/Style/Examples/007/center.en.html

### Aligning inline elements (images/icons with text)

Use `vertical-align: middle` on inline elements:

```css
.icon {
  vertical-align: middle;
}

.text {
  display: inline;
  vertical-align: middle;
}
```

**Important:** `vertical-align` does NOT work on flex items. If using flexbox, the property is ignored.

### Flexbox centering

```css
.container {
  display: flex;
  align-items: center;      /* vertical */
  justify-content: center;  /* horizontal */
}
```

### CSS specificity matters

When overriding styles, ensure your rule has higher specificity or comes later in the cascade:

```css
/* Lower specificity */
.modal-body strong {
  display: block;
}

/* Higher specificity - wins */
.modal-body .privacy-modal-title strong {
  display: inline;
}
```
