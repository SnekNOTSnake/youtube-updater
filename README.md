# Youtube Updater

This package updates specific Youtube video's title for every desired minutes (default is 3) based on its total views.

## Installation and Running

If you only want this work to, well... work, you only need to run the following command:

```bash
cp sample.config.env config.env

yarn run start:prod
```

If you want it to work with some express shit:

```bash
cp sample.config.env config.env
cp token/sample.token.json token/token.json

yarn run start
```
