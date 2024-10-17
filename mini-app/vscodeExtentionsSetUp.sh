# sudo chmod +x vscodeExtentionsSetUp.sh
# this is not going to work on WSL: remove --profile mini-app on WSL

code --profile mini-app --add # also remove this on WSL
code --profile mini-app # also remove this on WSL

code --profile mini-app --install-extension christian-kohler.npm-intellisense
code --profile mini-app --install-extension dbaeumer.vscode-eslint
code --profile mini-app --install-extension editorconfig.editorconfig
code --profile mini-app --install-extension esbenp.prettier-vscode
code --profile mini-app --install-extension humao.rest-client
code --profile mini-app --install-extension orta.vscode-jest
code --profile mini-app --install-extension redhat.vscode-yaml
code --profile mini-app --install-extension ms-vscode.atom-keybindings

code --profile mini-app --install-extension bmalehorn.vscode-fish
code --profile mini-app --install-extension eamodio.gitlens
code --profile mini-app --install-extension ecmel.vscode-html-css
code --profile mini-app --install-extension github.vscode-github-actions
code --profile mini-app --install-extension gruntfuggly.todo-tree
code --profile mini-app --install-extension ms-azuretools.vscode-docker
code --profile mini-app --install-extension donjayamanne.githistory
code --profile mini-app --install-extension bradlc.vscode-tailwindcss