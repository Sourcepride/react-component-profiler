# React Component Profiler

Get an insight of how many components are in your (React/NextJs) project and where they are being used.

## Features

- number of components in component folders
- number of components present in every file
- number of times a component is used by other components
- link to possible files component is called from
- list of all hooks used in a component file
- component search (coming soon...)
- refresh
- show only component files toggle
- show only components toggle


![full image](resources/full-image-display.png)
![profiler tab](resources/main-image-display.png)


## Configuration
By default the extension assumes all project socurce code lives inside the src directory which is usally not the case especially with nextjs.

to point the extension to app as your sourcecode folder add this settings to settings.json

```
{
     "react-component-profiler": {
         "srcFolder": "app"
     },
}
```


## Contribute
Please feel free to contribute to this project or raise an issue/ pull request. see our [contributions.md](CONTRIBUTIONS.md)

## Release Notes