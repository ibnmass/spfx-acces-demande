#!/bin/bash
npx heft build
npx heft package-solution
mkdir -p public
cp -r sharepoint/solution public/solution
SPPKG=$(ls sharepoint/solution/*.sppkg | xargs basename)
echo "<html><body><h1>Mon WebPart SPFx</h1><a href='/solution/$SPPKG'>Télécharger le .sppkg</a></body></html>" > public/index.html
