if(!self.define){let e,a={};const n=(n,s)=>(n=new URL(n+".js",s).href,a[n]||new Promise((a=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=a,document.head.appendChild(e)}else e=n,importScripts(n),a()})).then((()=>{let e=a[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,i)=>{const f=e||("document"in self?document.currentScript.src:"")||location.href;if(a[f])return;let c={};const r=e=>n(e,f),t={module:{uri:f},exports:c,require:r};a[f]=Promise.all(s.map((e=>t[e]||r(e)))).then((e=>(i(...e),c)))}}define(["./workbox-1846d813"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/chunks/1272-fc707f8456699f21e6a9.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/144-0372f036e38e3cdaa239.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/1691.c1bd153488bdb32096f4.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/1766.15adce6116402d97a60a.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/2613-8047c086ef2a73f55661.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/2699.04970411fa28e5efbfd3.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/4ad82c5e.e9947b6456459bf01020.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/5377-48943648ad68fdf1bc2c.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/5e791513.7dbdcf06c7c4f22e3809.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/6600.8e8deccbb3d1f92e74e3.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/7063-438cfe12e2028c95846b.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/7101-ae07dfc4a768b8c3e32a.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/7227.03e08d7ed84e36890e74.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/7542-7392832d9c38a59c0be9.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/7585-cea14fb86da7b94031e6.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/75fc9c18-2a20c2e7f10e4bdea475.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/8066-3d2be4bd77a08fd6ada7.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/8958-7718beca50d456770b42.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/fae9a131.6f661848239abef55a27.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/framework-34c5a4b8137ffdbfac41.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/main-aced7c6afb2efe5a1b70.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/404-1156ce242317bca94ea9.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/_app-f3bff50f230dad08c3db.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/_error-5f8d1e3305f226000869.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/about-780dc760723b420c2596.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/accounts/signin-callback-06fdc278c6a66f74cd3f.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/accounts/signout-callback-3e514ba8d4baecf1e17c.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/authentication/%5B...all%5D-f7f29a7e139b91e97d02.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/contact-f6095ec6452b6460620f.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/courses-1847648eafa6a2c20284.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/courses/%5BcourseId%5D-adc65428acd8eb094870.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/courses/%5BcourseId%5D/learn/%5B...all%5D-0d9b5ab09a11508a973a.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/index-9196dffc5fc52b4ca30d.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/modal/%5B...all%5D-e6b32d8c6e9e91e95d3b.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/posts-fba469d7a3e40659de76.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/posts/%5BpostId%5D-aaa1f41b8f5f6a1ee7a0.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/privacy-bdc0af12264fe5dcd16a.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/teach-ef5a94aba55caae67a3b.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/terms-d1cc10ebd131a6dbd6be.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/pages/test-5fd17c2754f526b16014.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/polyfills-a40ef1678bae11e696dba45124eadd70.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerDailyMotion.cd84b73f7d61de49650f.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerFacebook.646fc1fcd164f0011d7a.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerFilePlayer.c89fe148c8e6fdf18a66.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerKaltura.0cf26e5fdb2d7ad9fef7.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerMixcloud.b22f4664b5898d69d3ac.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerPreview.abdb3df1d925bc78286f.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerSoundCloud.2d782e2e243baa009164.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerStreamable.2ee32b1753d93583c2ea.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerTwitch.4c11f9518037eff7acca.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerVidyard.7655b5c74cf092c5bf3e.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerVimeo.fec79dce080807c5360c.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerWistia.050b967beb9b9517b24b.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/reactPlayerYouTube.bfd622e565bbad9e5d40.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/chunks/webpack-75be44d52c0b6e78537b.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/css/7d818bc7355e4fdb6313.css",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/css/d10b095e834aaa28e32a.css",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/ohUuVcyDndAkwfZ4Okqgg/_buildManifest.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/_next/static/ohUuVcyDndAkwfZ4Okqgg/_ssgManifest.js",revision:"ohUuVcyDndAkwfZ4Okqgg"},{url:"/favicon/android-chrome-192x192.png",revision:"e148072ed638e61790e4078839548cc0"},{url:"/favicon/android-chrome-256x256.png",revision:"fadf25133427fd4980d757ca935e6de8"},{url:"/favicon/apple-touch-icon-precomposed.png",revision:"99d13f57d79de183d2ff059f286d8212"},{url:"/favicon/apple-touch-icon.png",revision:"206557a79834ffc1f0da2765ba40ba6a"},{url:"/favicon/browserconfig.xml",revision:"c9eccf98b719a10127c7d6254788605a"},{url:"/favicon/favicon-16x16.png",revision:"c359a5a7daba058620cd0e51659b07ca"},{url:"/favicon/favicon-32x32.png",revision:"f56e922253102aa2a124ae0359999fd8"},{url:"/favicon/favicon.ico",revision:"ac87e0c7508e48182d91e06cf792a9f2"},{url:"/favicon/mstile-150x150.png",revision:"283f047b029ef8162b4aa13f83cff3af"},{url:"/favicon/safari-pinned-tab.svg",revision:"6afb41b7b2891e9be6203f800e4f048d"},{url:"/fonts/fira-sans/fira-sans-v15-latin-100.woff",revision:"a301a12b5ab6de5686ae02b2476d495a"},{url:"/fonts/fira-sans/fira-sans-v15-latin-100.woff2",revision:"d7e5510274c79e53bb5b65acf3be78c2"},{url:"/fonts/fira-sans/fira-sans-v15-latin-100italic.woff",revision:"1a2487b12bad754ce77d1f0778674df5"},{url:"/fonts/fira-sans/fira-sans-v15-latin-100italic.woff2",revision:"e90273a7cb127ec910c5c38b4ff6b467"},{url:"/fonts/fira-sans/fira-sans-v15-latin-200.woff",revision:"2be527a8b37e205410012ce355f1aa65"},{url:"/fonts/fira-sans/fira-sans-v15-latin-200.woff2",revision:"d8ef58b4bb7bdc37a581cdabb8f5172e"},{url:"/fonts/fira-sans/fira-sans-v15-latin-200italic.woff",revision:"36c642ac328a7f99949c8e2bee356a48"},{url:"/fonts/fira-sans/fira-sans-v15-latin-200italic.woff2",revision:"daba4dd2e35506e7ca7eaf5498a0dfc6"},{url:"/fonts/fira-sans/fira-sans-v15-latin-300.woff",revision:"4dca71a661b348c6efc4675659afa8fb"},{url:"/fonts/fira-sans/fira-sans-v15-latin-300.woff2",revision:"d90c9f754a38229355a68e57d560ba62"},{url:"/fonts/fira-sans/fira-sans-v15-latin-300italic.woff",revision:"6b1fd4e2c63aed329fcc459be949b843"},{url:"/fonts/fira-sans/fira-sans-v15-latin-300italic.woff2",revision:"277c3e5953e00c3d124f8c48bb49ec27"},{url:"/fonts/fira-sans/fira-sans-v15-latin-500.woff",revision:"2ea8476cca14d7a9d09449efc48d4aed"},{url:"/fonts/fira-sans/fira-sans-v15-latin-500.woff2",revision:"d36cf1e01f039283292b186b9c85c883"},{url:"/fonts/fira-sans/fira-sans-v15-latin-500italic.woff",revision:"b2762b4352b2a0ec985af41dd1d8be0e"},{url:"/fonts/fira-sans/fira-sans-v15-latin-500italic.woff2",revision:"4bbf5e384d6b06f7db8b753560992cc1"},{url:"/fonts/fira-sans/fira-sans-v15-latin-600.woff",revision:"7cb8903389da1e0d27ff32d47d956174"},{url:"/fonts/fira-sans/fira-sans-v15-latin-600.woff2",revision:"96535c146ffa5386af6a241b26a3a6b4"},{url:"/fonts/fira-sans/fira-sans-v15-latin-600italic.woff",revision:"b4592f84f6b4fa0329e1f77cfea347e0"},{url:"/fonts/fira-sans/fira-sans-v15-latin-600italic.woff2",revision:"fd4f87a12e1c8fbad018b77311dc9763"},{url:"/fonts/fira-sans/fira-sans-v15-latin-700.woff",revision:"8ea20e69b784bfa7e7078907030f1cc1"},{url:"/fonts/fira-sans/fira-sans-v15-latin-700.woff2",revision:"2ca1253c8e47277b38c02353cdf32102"},{url:"/fonts/fira-sans/fira-sans-v15-latin-700italic.woff",revision:"adb6db8adeec59004e3e944220e3c9f1"},{url:"/fonts/fira-sans/fira-sans-v15-latin-700italic.woff2",revision:"251cc4687a7f55281ab73945b1f9c993"},{url:"/fonts/fira-sans/fira-sans-v15-latin-800.woff",revision:"3fcacde5394fd4586b3fd93f742f09da"},{url:"/fonts/fira-sans/fira-sans-v15-latin-800.woff2",revision:"89c9e74d4d7c9ec23ab8f245a49dc9a1"},{url:"/fonts/fira-sans/fira-sans-v15-latin-800italic.woff",revision:"9aa80aa5338cc530a980ab53b84cfea4"},{url:"/fonts/fira-sans/fira-sans-v15-latin-800italic.woff2",revision:"df066409da39a4524ff1fbdb68492433"},{url:"/fonts/fira-sans/fira-sans-v15-latin-900.woff",revision:"fc5a03b8b3faaf1b5d768e6ed224c43c"},{url:"/fonts/fira-sans/fira-sans-v15-latin-900.woff2",revision:"7a09849c1b60dc235f3b3c15434adbaa"},{url:"/fonts/fira-sans/fira-sans-v15-latin-900italic.woff",revision:"20b37fe9c7ff04a139567ab95959d2fe"},{url:"/fonts/fira-sans/fira-sans-v15-latin-900italic.woff2",revision:"59bd0ddf1ba10e6f7ab0891a6f91e0bd"},{url:"/fonts/fira-sans/fira-sans-v15-latin-italic.woff",revision:"a3c51401a9ede284e37985ea54b173da"},{url:"/fonts/fira-sans/fira-sans-v15-latin-italic.woff2",revision:"cc3c05a080b3b37e42a52d2f1809f12b"},{url:"/fonts/fira-sans/fira-sans-v15-latin-regular.woff",revision:"effc821f9f1ddba41ab63085d068e216"},{url:"/fonts/fira-sans/fira-sans-v15-latin-regular.woff2",revision:"4528524c7142b4e2d5c0438763223328"},{url:"/fonts/inter/Inter-Black.woff",revision:"d0b121f3a9d3d88afdfd6902d31ee9a0"},{url:"/fonts/inter/Inter-Black.woff2",revision:"661569afe57a38e1529a775a465da20b"},{url:"/fonts/inter/Inter-BlackItalic.woff",revision:"e3329b2b90e1f9bcafd4a36604215dc1"},{url:"/fonts/inter/Inter-BlackItalic.woff2",revision:"a3cc36c89047d530522fc999a22cce54"},{url:"/fonts/inter/Inter-Bold.woff",revision:"99a0d9a7e4c99c17bfdd94a22a5cf94e"},{url:"/fonts/inter/Inter-Bold.woff2",revision:"444a7284663a3bc886683eb81450b294"},{url:"/fonts/inter/Inter-BoldItalic.woff",revision:"3aa31f7356ea9db132b3b2bd8a65df44"},{url:"/fonts/inter/Inter-BoldItalic.woff2",revision:"96284e2a02af46d9ffa2d189eaad5483"},{url:"/fonts/inter/Inter-ExtraBold.woff",revision:"ab70688a1c9d6525584b123575f6c0a5"},{url:"/fonts/inter/Inter-ExtraBold.woff2",revision:"37da9eecf61ebced804b266b14eef98e"},{url:"/fonts/inter/Inter-ExtraBoldItalic.woff",revision:"728a4c7df3ed1b2bc077010063f9ef1c"},{url:"/fonts/inter/Inter-ExtraBoldItalic.woff2",revision:"fcc7d60ef790b43eb520fdc5c7348799"},{url:"/fonts/inter/Inter-ExtraLight.woff",revision:"dd19efda9c6e88ad83a5b052915899f7"},{url:"/fonts/inter/Inter-ExtraLight.woff2",revision:"b3b2ed6a20c538e9c809f4df5c04ac2a"},{url:"/fonts/inter/Inter-ExtraLightItalic.woff",revision:"a6566ae6fa3c58b48f888d7c9c234d52"},{url:"/fonts/inter/Inter-ExtraLightItalic.woff2",revision:"079cd1e71cd4f73bef86f72deced6d03"},{url:"/fonts/inter/Inter-Italic.woff",revision:"f137a90d649b6ab032563856df323f40"},{url:"/fonts/inter/Inter-Italic.woff2",revision:"fd26ff23f831db9ae85a805386529385"},{url:"/fonts/inter/Inter-Light.woff",revision:"5d3776eb78374b0ebbce639adadf73d1"},{url:"/fonts/inter/Inter-Light.woff2",revision:"780dd2adb71f18d7a357ab7f65e881d6"},{url:"/fonts/inter/Inter-LightItalic.woff",revision:"d0fa7cbcf9ca5edb6ebe41fd8d49e1fb"},{url:"/fonts/inter/Inter-LightItalic.woff2",revision:"df29c53403b2e13dc56df3e291c32f09"},{url:"/fonts/inter/Inter-Medium.woff",revision:"c0638bea87a05fdfa2bb3bba2efe54e4"},{url:"/fonts/inter/Inter-Medium.woff2",revision:"75db5319e7e87c587019a5df08d7272c"},{url:"/fonts/inter/Inter-MediumItalic.woff",revision:"a1b588627dd12c556a7e3cd81e400ecf"},{url:"/fonts/inter/Inter-MediumItalic.woff2",revision:"f1e11535e56c67698e263673f625103e"},{url:"/fonts/inter/Inter-Regular.woff",revision:"3ac83020fe53b617b79b5e2ad66764af"},{url:"/fonts/inter/Inter-Regular.woff2",revision:"dc131113894217b5031000575d9de002"},{url:"/fonts/inter/Inter-SemiBold.woff",revision:"66a68ffab2bf40553e847e8f025f75be"},{url:"/fonts/inter/Inter-SemiBold.woff2",revision:"007ad31a53f4ab3f58ee74f2308482ce"},{url:"/fonts/inter/Inter-SemiBoldItalic.woff",revision:"6cd13dbd150ac0c7f337a2939a3d50a8"},{url:"/fonts/inter/Inter-SemiBoldItalic.woff2",revision:"3031b683bafcd9ded070c00d784f4626"},{url:"/fonts/inter/Inter-Thin.woff",revision:"b068b7189120a6626e3cfe2a8b917d0f"},{url:"/fonts/inter/Inter-Thin.woff2",revision:"d52e5e38715502616522eb3e9963b69b"},{url:"/fonts/inter/Inter-ThinItalic.woff",revision:"97bec98832c92f799aeebf670b83ff6c"},{url:"/fonts/inter/Inter-ThinItalic.woff2",revision:"a9780071b7f498c1523602910a5ef242"},{url:"/fonts/inter/Inter-italic.var.woff2",revision:"1f7ca6383ea7c74a7f5ddd76c3d3cef2"},{url:"/fonts/inter/Inter-roman.var.woff2",revision:"66c6e40883646a7ad993108b2ce2da32"},{url:"/fonts/inter/Inter.var.woff2",revision:"8dd26c3dd0125fb16ce19b8f5e8273fb"},{url:"/fonts/inter/inter.css",revision:"e9bec16165ea2531cd2293ad21cfddbf"},{url:"/img/img1.jpg",revision:"3cf0a25f13c9c3838c03b1192485dfc3"},{url:"/img/img2.jpg",revision:"9c442b13e477b0bcd9e4141516d9ec2f"},{url:"/img/img3.png",revision:"3ef5c140bfadbc45d91938a5427e8af2"},{url:"/img/prince-owusu-profile.png",revision:"c7b7158a34f5d5b17d7339838ee009bc"},{url:"/manifest.json",revision:"5144c0e818e32481a4ffb6c58c2cabfd"},{url:"/robots.txt",revision:"8beac265d9ac92c13a30c6a4189b973b"},{url:"/sitemap-0.xml",revision:"fc1ae3f6aa89b67394f483dd8537849d"},{url:"/sitemap.xml",revision:"30ee322ceb8c39c721162951e27af315"},{url:"/sounds/correct.mp3",revision:"5aa075cc5b8de784654ea2bd1531cf72"},{url:"/sounds/incorrect.mp3",revision:"dcdff54843a4ffcbfcfec604f4bd475e"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:a,event:n,state:s})=>a&&"opaqueredirect"===a.type?new Response(a.body,{status:200,statusText:"OK",headers:a.headers}):a}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const a=e.pathname;return!a.startsWith("/api/auth/")&&!!a.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
