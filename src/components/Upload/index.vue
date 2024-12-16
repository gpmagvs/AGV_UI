<template>
  <div>
    <el-upload
      class="upload-demo"
      ref="upload"
      :action="action_api"
      accept=".zip"
      :file-list="fileList"
      :on-change="handleChanged"
      :on-remove="handleRemove"
      :auto-upload="false"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :limit="1"
    >
      <el-button ref="select_file" type="primary">選擇更新檔</el-button>
    </el-upload>
    <el-button :disabled="!selectedFile" id="upload-button" @click="submitUpload">上傳</el-button>
    <div>共 {{ selectedFile ? '1' : '0' }}個檔案，已完成上傳 {{ uploaded_cnt }}</div>
  </div>
</template>
<script>
import param from '@/gpm_param'
import bus from '@/event-bus'
export default {
  data() {
    return {
      fileList: [],
      uploaded_cnt: 0,
      selectedFile: undefined,
      isUploadedSuccess: false
    }
  },
  computed: {
    action_api() {
      return `${param.backend_host}/api/Upload/UploadSystemUpdateZipFile`
    },

  },
  methods: {
    submitUpload() {
      this.uploaded_cnt = 0;
      this.isUploadedSuccess = false;
      var _isFileEmpty = !this.selectedFile;
      if (_isFileEmpty) {
        this.$swal.fire(
          {
            title: '請選擇更新檔!',
            text: '',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        return;
      }
      this.SubscribeConnectionStatus();
      this.$refs.upload.submit();
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
      this.selectedFile = undefined;
      this.uploaded_cnt = 0;
      this.isUploadedSuccess = false;
      this.$refs.upload.clearFiles();
    },
    handleChanged(file) {
      this.selectedFile = file;
    },
    handleUploadSuccess(response, file, fileList) {
      this.uploaded_cnt += 1;
      this.isUploadedSuccess = true;
    },
    handleUploadError(error, uploadFile, uploadFiles) {
      this.$swal.fire(
        {
          text: uploadFile.filename,
          title: '',
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
    },
    handleExceed(files) {
      this.fileList = files
      //this.$refs.upload.clearFiles();
    },
    UnSubscribeConnectionStatus() {
      bus.off("hub-reconnecting", this.ShowUpdatingSwal());
      bus.off("hub-connected", this.ShowUpdateSuccessSwal());
    },
    ShowUpdatingSwal() {
      this.$swal.fire(
        {
          title: '車載系統更新中..請稍後',
          text: '',
          icon: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
    },
    ShowUpdateSuccessSwal() {
      this.UnSubscribeConnectionStatus();
      this.$swal.fire(
        {
          title: '車載系統已完成更新!',
          text: '',
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
    },
    SubscribeConnectionStatus() {
      //bus.on("hub-reconnecting", () => this.ShowUpdatingSwal())
      bus.on("hub-connected", () => this.ShowUpdateSuccessSwal())
    }
  },
  mounted() {
  },
}
</script>
<style lang="scss" scoped>
#upload-button {
  position: absolute;
  top: 85px;
  right: 133px;
}
</style>