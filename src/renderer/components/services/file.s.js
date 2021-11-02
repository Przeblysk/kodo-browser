import webModule from '@/app-module/web'

import CodeMirror from '@/libCompatible/codemirror'

const FILE_SVS_FACTORY = 'fileSvs'

webModule.factory(FILE_SVS_FACTORY, [
  "$q",
  function ($q) {
    return {
      /**
       * 根据后缀判断
       * @param  item = {name, size}
       * @return obj = {type, ...}
       *     type: [picture|code|others|doc|video|audio]
       */
      getFileType: function (item) {
        if (item.itemType === 'folder') {
          return {
            type: "folder",
            ext: []
          };
        }

        const ext = item.path.extname() ? item.path.extname().substring(1) : '';

        switch (ext) {
        case "png":
        case "jpg":
        case "jpeg":
        case "bmp":
        case "gif":
          return {
            type: "picture",
            ext: [ext]
          };

        case "doc":
        case "docx":
        case "pdf":
          return {
            type: "doc",
            ext: [ext]
          };

        case "mp4":
          return {
            type: "video",
            ext: [ext],
            mineType: "video/mp4"
          };
        case "webm":
          return {
            type: "video",
            ext: [ext],
            mineType: "video/webm"
          };
        case "mov":
          return {
            type: "video",
            ext: [ext],
            mineType: "video/quicktime"
          };
        case "ogv":
          return {
            type: "video",
            ext: [ext],
            mineType: "video/ogg"
          };
        case "flv":
          return {
            type: "video",
            ext: [ext],
            mineType: "video/x-flv"
          };

        case "mp3":
          return {
            type: "audio",
            ext: [ext],
            mineType: "audio/mp3"
          };
        case "ogg":
          return {
            type: "audio",
            ext: [ext],
            mineType: "audio/ogg"
          };
        }

        var codeMode = CodeMirror.findModeByExtension(ext);
        if (codeMode) {
          codeMode.type = "code";

          return codeMode;
        }

        return {
          type: "others",
          ext: [ext]
        };
      }
    };
  }
]);

export default FILE_SVS_FACTORY