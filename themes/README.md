# GitHub Stats Engine themes

GitHub Stats Engine includes the themes exported by `themes/index.js`.
Use a theme with the `theme` query parameter:

```text
http://localhost:9004/?username=siddharth-ss&theme=dark&show_icons=true
```

Theme names are defined in [themes/index.js](./index.js). The card renderer
also accepts custom `title_color`, `icon_color`, `text_color`, `bg_color`,
`ring_color`, and `border_color` values.
