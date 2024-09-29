<template>
  <div class="audio-selector">
    <div class="audio-upload mb-4">
      <el-upload
        class="upload-demo"
        :action="audioUploadUrl"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        accept=".mp3, .wav"
      >
        <el-button type="primary">上傳音檔</el-button>
        <template #tip>
          <div class="el-upload__tip">只能上傳 mp3/wav 檔案，且不超過 10MB</div>
        </template>
      </el-upload>
    </div>
    <el-table :data="playlist" style="width: 100%" height="60%" size="large" border stripe>
      <el-table-column prop="name" label="Audio Name" width="180"></el-table-column>
      <el-table-column prop="path" label="Path" min-width="200"></el-table-column>
      <el-table-column label fixed="right" width="240">
        <template #default="scope">
          <el-button
            circle
            :type="scope.row.isPlaying ? 'danger' : 'primary'"
            @click="scope.row.isPlaying ? stopAudio(scope.row) : playAudio(scope.row)"
            style="margin-right: 10px;"
          >
            <i :class="scope.row.isPlaying ? 'bi bi-stop-fill' : 'bi bi-play-fill'"></i>
          </el-button>
          <el-button type="success" @click="selectAudio(scope.row)">選取</el-button>
          <el-button type="danger" @click="deleteAudio(scope.row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import param from '@/gpm_param';
export default {
  data() {
    return {
      playlist: [],
      audioPlayer: new Audio()
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.fetchAudioFiles();
    });
  },
  computed: {
    audioUploadUrl() {
      return `${param.backend_host}/api/Sounds/UploadAudio`;
    }
  },
  methods: {
    async fetchAudioFiles() {
      try {
        const response = await fetch(`${param.backend_host}/api/Sounds/GetUsableAudios`);
        const files = await response.json();
        this.playlist = files.map(file => ({
          name: file.fileName,
          path: file.fileFullPath,
          duration: '00:00', // You might want to fetch actual duration if available
          isPlaying: false
        }));
        this.playlist.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error fetching audio files:', error);
      }
    },
    playAudio(audio) {
      // Stop all playing audio
      this.playlist.forEach(a => {
        a.isPlaying = false;
      });

      // Set up new audio
      this.audioPlayer.src = `${param.backend_host}/audios/${audio.name}`;
      this.audioPlayer.play().catch(error => {
        console.error('Error playing audio:', error);
      });

      audio.isPlaying = true;
      console.log(`Playing audio: ${audio.name}`);

      // Set up onended event
      this.audioPlayer.onended = () => {
        audio.isPlaying = false;
      };
    },
    stopAudio(audio) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      audio.isPlaying = false;
      console.log(`Stopping audio: ${audio.name}`);
    },
    selectAudio(audio) {
      console.log(`Selected audio: ${audio.path}`);
      // Implement audio selection logic here, e.g., emit an event
      this.$emit('audioSelected', audio.path);
    },
    async deleteAudio(audio) {
      console.log(`Deleting audio: ${audio.name}`);
      // Call API to delete the audio file
      try {
        await fetch(`${param.backend_host}/api/Sounds?audioName=${encodeURIComponent(audio.name)}`, {
          method: 'DELETE'
        });
        console.log(`Audio file ${audio.name} deleted successfully`);
        this.$message.success(`音效 ${audio.name} 已成功刪除`);
        this.fetchAudioFiles();
      } catch (error) {
        console.error('Error deleting audio file:', error);
        this.$message.error(`刪除音效 ${audio.name} 失敗`);
      }
      // Implement audio deletion logic here, e.g., emit an event
      //this.$emit('audioDeleted', audio.name);
    },
    handleUploadSuccess(response, file, fileList) {
      console.log('Upload success:', response, file, fileList);
      this.fetchAudioFiles();
      this.$message.success('上傳成功');
    },
    handleUploadError(err, file, fileList) {
      console.log('Upload error:', err, file, fileList);
      this.$message.error('上傳失敗');
    },
    beforeUpload(file) {
      console.log('Before upload:', file);
      return true;
    }
  }
}
</script>

<style scoped>
/* Add any necessary styles here */
</style>