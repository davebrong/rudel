# Session Context

## User Prompts

### Prompt 1

this PR did add chatwood. but the configuration was added in a weird runtime api exposed way. make it simpler, and just let vite bundle it at build time. and then we fix the deployment on fly to pass that env on build as well

### Prompt 2

i will not provide the build.args directly in fly.toml, but i will rather pass them at deploy time, can I pass them from github actions? to the fly deploy?

### Prompt 3

this is the script from chatwood, can you extract the secrets and use doppler to add them to the CI config:\
<script>
  window.chatwootSettings = {"position":"right","type":"standard","launcherTitle":""};
  (function(d,t) {
    var BASE_URL="https://app.chatwoot.com";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteT...

### Prompt 4

no doppler syncs to github secrest automatically, so if you added them to doppler CI config, it will be in github

### Prompt 5

okay great commit those changes

