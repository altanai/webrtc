const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-babel-minify');
const pipeline = require('readable-stream').pipeline;
const cleanCSS = require('gulp-clean-css');
const replace = require('gulp-replace');
const less = require('gulp-less');
// const iife = require("gulp-iife");
// const babel = require('gulp-babel');
const exec = require('child_process').exec;
// var remoteSrc = require('gulp-remote-src');
var rev = require('gulp-rev-timestamp');
const del = require('del');
const fs = require('fs');
const sourcemaps = require('gulp-sourcemaps');

const _properties = require('./env.js')(fs).readEnv();
const properties = JSON.parse(_properties);
console.log("Properties ", properties);

var folderPath = "";
if (properties.enviornment == "production") {
    folderPath = 'prod/';
} else if (properties.enviornment == "test") {
    folderPath = 'tests/';
} else {
    folderPath = 'build/';
}

var header = require('gulp-header'),
    date = new Date(),
    pckg = require("./package.json"),
    version = pckg.version,
    headerComment = '/* Generated on:' + date +
        ' || version: ' + version + ' - Altanai (@altanai)  , License : MIT  */ \n';

// gulp.task('clean', function(done) {
//   return Promise.all([
//     del(dist),
//     del(srcBundleJs)
//   ]);
// });

gulp.task('clean', function (done) {
    del.sync('build');
    done();
});

gulp.task('vendorjs', function (done) {
    let list = [
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/bootstrap/dist/js/bootstrap.bundle.js",
        "node_modules/socket.io-client/dist/socket.io.js"
    ];
    console.log(list);
    gulp.src(list)
        .pipe(rev({strict: true}))
        .pipe(header(headerComment))
        // .pipe(uglify())
        .pipe(concat('webrtcdevelopment_header.js'))
        .pipe(gulp.dest(folderPath));
    done();
});

/*gulp.task('adminjs',function() {
    console.log(" gulping admin script  ");
    list=[
        "client/build/scripts/admin.js",
    ];
    console.log(list);
    gulp.src(list)
        .pipe(uglify())
        .pipe(concat('webrtcdevelopmentAdmin.js'))
        .pipe(gulp.dest(folderPath+'minScripts/'));
});*/

gulp.task('server', function (done) {
    console.log(" gulping admin script  ");
    let list = [
        "server/redisscipts.js",
        "server/realtimecomm.js",
        "server/restapi.js"
    ];
    console.log(list);
    gulp.src(list)
        .pipe(rev({strict: true}))
        .pipe(header(headerComment))
        // .pipe(uglify())
        .pipe(concat('webrtcdevelopmentServer.js'))
        .pipe(gulp.dest(folderPath));
    done();
});

gulp.task('drawjs', function (done) {
    console.log(" gulping drawjs  ");
    let scriptList = [
        "client/src/drawboard/common.js",
        "client/src/drawboard/decorator.js",
        "client/src/drawboard/draw-helper.js",
        "client/src/drawboard/drag-helper.js",
        "client/src/drawboard/pencil-handler.js",
        "client/src/drawboard/eraser-handler.js",
        "client/src/drawboard/line-handler.js",
        "client/src/drawboard/rect-handler.js",
        "client/src/drawboard/text-handler.js",
        "client/src/drawboard/events-handler.js"
    ];
    console.log(scriptList);
    // gulp.src(list)
    //     .pipe(uglify())
    //     .pipe(concat('drawBoardScript.js'))
    //     .pipe(gulp.dest(folderPath));
    pipeline(gulp.src(scriptList, {allowEmpty: true}),
        replace(/use strict/g, ''),
        replace(/@@version/g, version),
        header(headerComment),
        concat('drawBoardScript.js'),
        gulp.dest(folderPath),
        uglify({
            mangle: {
                keepClassName: true
            }
        }),
        rev(),
        header(headerComment),
        concat('drawBoardScript_min.js'),
        gulp.dest(folderPath)
    );
    done();
});

gulp.task('drawcss', function (done) {
    console.log(" gulping main drawcss  ");
    let list = [
        "client/src/drawboard/drawing.css"
    ];
    console.log(list);
    gulp.src(list)
        .pipe(concat('drawBoardCss_min.css'))
        .pipe(gulp.dest(folderPath));
    done();

});

gulp.task('codejs', function (done) {
    console.log(" gulping codejs  ");
    let list = [
        "client/src/codemirror/lib/codemirror.js",
        "client/src/codemirror/addon/selection/active-line.js",
        "client/src/codemirror/addon/mode/loadmode.js",
        "client/src/codemirror/mode/meta.js",
        "client/src/codemirror/mode/javascript/javascript.js",
        "client/src/codemirror/codeStyles.js"
    ];
    console.log(list);
    gulp.src(list)
        .pipe(uglify())
        .pipe(concat('codeEditorScript.js'))
        .pipe(gulp.dest(folderPath));
    done();
});

gulp.task('codecss', function (done) {
    console.log(" gulping main codecss  ");
    let list = [
        "client/src/codemirror/theme/mdn-like.css",
        "client/src/codemirror/lib/codemirror.css",
        "client/src/codemirror/style.css"
    ];
    console.log(list);
    gulp.src(list)
        .pipe(concat('codeEditorCss.css'))
        .pipe(gulp.dest(folderPath));
    done();
});

var scriptList = [

    // -------------------- webrtc dev logger
    "client/src/scripts/_logger.js",

    //---------------------------RTC
    "client/src/scripts/RTC_header.js",
    "client/src/scripts/RTC_DetectRTC.js",
    "client/src/scripts/RTC_global.js",
    // "client/src/scripts/RTC_ioshacks.js",
    "client/src/scripts/RTC_PeerConnection.js",
    "client/src/scripts/RTC_CodecHandler.js",
    "client/src/scripts/RTC_OnIceCandidateHandler.js",
    "client/src/scripts/RTC_IceServerHandler.js",
    "client/src/scripts/RTC_getUserMediaHandler.js",
    "client/src/scripts/RTC_StreamsHandler.js",
    "client/src/scripts/RTC_TextReceiverSender.js",
    "client/src/scripts/RTC_FileProgressBarHandler.js",
    // "client/src/scripts/RTC_Translator.js",
    "client/src/scripts/RTC_RTCMultiConnection.js",
    // "client/src/scripts/januscomm.js",
    "client/src/scripts/RTC_footer.js",

    // --------------------- helper libs
    "client/src/helperlibs/html2canvas.js",
    "client/src/scripts/head.js",
    "client/src/scripts/globals.js",
    "client/src/scripts/_init.js",

    // --------------------- dom modifiers
    "client/src/dommodifiers/_dommodifier.js",
    "client/src/dommodifiers/_webcallviewmanager.js",
    "client/src/dommodifiers/_filesharing_dommodifier.js",
    "client/src/dommodifiers/_media_dommodifier.js",
    "client/src/dommodifiers/_notify.js",
    "client/src/dommodifiers/_screenshare_dommodifier.js",
    "client/src/dommodifiers/_screenrecord_dommodifier.js",
    "client/src/dommodifiers/_chat_dommodifier.js",
    "client/src/dommodifiers/_draw_dommodifier.js",
    "client/src/dommodifiers/_timer_dommodifier.js",
    // "client/src/scripts/_settings.js",

    // --------------------- stats and analytics
    "client/src/analytics/_stats.js",

    // ---------------------- scripts
    "client/src/scripts/_screenshare.js",
    "client/src/scripts/FileBufferReader.js",
    "client/src/scripts/MediaStreamRecorder.js",
    "client/src/scripts/RecordRTC.js",
    "client/src/scripts/_snapshot.js",
    "client/src/scripts/_geolocation.js",
    "client/src/scripts/_chat.js",
    "client/src/scripts/_mediacontrol.js",
    "client/src/scripts/_record.js",
    "client/src/scripts/_screenrecord.js",
    "client/src/scripts/_filesharing.js",
    "client/src/scripts/_draw.js",
    "client/src/scripts/_redial.js",
    "client/src/scripts/_listenin.js",
    "client/src/scripts/_cursor.js",
    "client/src/scripts/_codeeditor.js",
    "client/src/scripts/_texteditor.js",
    "client/src/scripts/_turn.js",
    "client/src/scripts/_timer.js",
    "client/src/scripts/_tracing.js",
    "client/src/scripts/_peerinfomanager.js",
    "client/src/scripts/_widgets.js",
    "client/src/scripts/_sessionmanager.js",
    "client/src/scripts/_exitmanager.js",

    "client/src/scripts/tail.js"
];

// .pipe( rev({strict: true}) )
gulp.task('webrtcdevelopmentjs', function (done) {
    console.log("gulping main webrtc development scripts ");
    // scriptList.push("client/src/scripts/admin.js");
    console.log(scriptList);
    pipeline(gulp.src(scriptList, {allowEmpty: true}),
        replace(/use strict/g, ''),
        replace(/@@version/g, version),
        header(headerComment),
        concat('webrtcdevelopment.js'),
        gulp.dest(folderPath),
        uglify({
            mangle: {
                keepClassName: true
            }
        }),
        rev(),
        header(headerComment),
        concat('webrtcdevelopment_min.js'),
        gulp.dest(folderPath)
    );
    done();
});

gulp.task('mainstyle', function (done) {
    console.log(" gulping main stylesheets css  ");
    let cssList = [
        "node_modules/font-awesome/css/font-awesome.min.css",
        "node_modules/remodal/dist/remodal.css",
        "node_modules/remodal/dist/remodal-default-theme.css",
        "node_modules/bootstrap/dist/css/bootstrap.min.css"
    ];
    console.log(cssList);
    // remoteSrc(cssList, {base: null})
    gulp.src(cssList)
        .pipe(rev({strict: true}))
        .pipe(header(headerComment))
        .pipe(concat('webrtcdevelopment_header.css'))
        .pipe(gulp.dest(folderPath));
    done();
});

gulp.task('webrtcdevelopmentcss', function (done) {
    console.log(" gulping custom stylesheets css  ");
    let cssList = [
        // "client/src/css/styles.css",
        "client/src/css/media.css",
        "client/src/css/chat.css",
        "client/src/css/cursor.css",
        "client/src/css/draw.css",
        "client/src/css/filesharing.css",
        "client/src/css/screenshare.css",
        "client/src/css/timer.css",
        "client/src/css/icons.css"
    ];
    console.log(cssList);
    gulp.src(cssList)
        .pipe(rev({strict: true}))
        .pipe(concat('webrtcdevelopment.css'))
        .pipe(gulp.dest(folderPath))
        .pipe(sourcemaps.init())
        .pipe(cleanCSS({debug: true}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(sourcemaps.write())
        .pipe(header(headerComment))
        .pipe(concat('webrtcdevelopment_min.css'))
        .pipe(gulp.dest(folderPath));
    done();

});

function execute(command, callback) {
    exec(command, function (error, stdout, stderr) {
        callback(stdout, stderr);
    });
}

gulp.task('git_pull', function (cb) {
    execute('git pull', function (resp) {
        cb(resp);
    });
});

gulp.task('fonts', function (cb) {
    console.log(" copying fonts to home dir ");
    execute('cp -r client/src/fonts .', function (resp) {
        console.log(resp);
        cb();
    });
});




// gulp webrtc dev css and js along with server changes
gulp.task('default', gulp.series(
    'webrtcdevelopmentjs',
    'webrtcdevelopmentcss',
    'server'
));

//gulp all components to make it production ready
gulp.task('production', gulp.series(
    'clean',
    'vendorjs',
    'drawjs',
    'drawcss',
    'codejs',
    'codecss',
    'webrtcdevelopmentjs',
    'mainstyle',
    'webrtcdevelopmentcss',
    'server',
    'fonts'
)); 
