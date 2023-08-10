<template>
  <div>
    <div class="d-flex fle-row border-bottom py-1 my-1">
      <el-button :disabled=" !HasAnyChange" type="primary" @click="SaveHandler">儲存</el-button>
      <el-button type="info" @click="AddTagTeachHandler">新增</el-button>
      <el-button type="info" @click="reload">重新載入</el-button>
    </div>
    <el-table :data="TeachDatas" height="600" size="small" v-loading="loading">
      <el-table-column label="Tag" prop="Tag">
        <template #default="scope">
          <div>
            <el-input
              @click="InputClicked"
              @change="InputChanged"
              type="number"
              v-model="scope.row.Tag"
            ></el-input>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-for="index in [0,1,2]" :key="index" :label="'layer-'+index">
        <el-table-column label="Up Pose(cm)">
          <template #default="scope">
            <el-input
              @click="InputClicked"
              @change="InputChanged"
              type="number"
              step="0.01"
              min="0"
              v-if="scope.row.Layers[index]!=undefined"
              v-model="scope.row.Layers[index].Value.Up_Pose"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column label="Down Pose(cm)">
          <template #default="scope">
            <el-input
              @click="InputClicked"
              @change="InputChanged"
              type="number"
              step="0.01"
              min="0"
              v-if="scope.row.Layers[index]!=undefined"
              v-model="scope.row.Layers[index].Value.Down_Pose"
            ></el-input>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column min-width="100">
        <template #default="scope">
          <div>
            <el-button @click="RemoveTagTeachSetting(scope.row)" type="danger" size="small">刪除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- <SimpleKeyboardVue></SimpleKeyboardVue> -->
  </div>
</template>

<script>
import { ForkAPI } from '@/api/VMSAPI'
import { ForkTeachStore } from '@/store'
import SimpleKeyboardVue from '@/components/Tools/SimpleKeyboard.vue';

export default {
  components: {
    SimpleKeyboardVue
  },
  data() {
    return {
      TeachDatas: [
        {
          Tag: 10,
          Layers: [
            {
              Key: 0,
              Value: {
                Name: "10-0",
                Up_Pose: 12.2,
                Down_Pose: 9
              }
            },
            {
              Key: 1,
              Value: {
                Name: "10-1",
                Up_Pose: 12.2,
                Down_Pose: 9
              }
            },

          ]
        },
        {
          Tag: 20,
          Layers: [
            {
              Key: 0,
              Value: {
                Name: "20-0",
                Up_Pose: 11.2,
                Down_Pose: 1
              }
            },
            {
              Key: 1,
              Value: {
                Name: "20-1",
                Up_Pose: 33.2,
                Down_Pose: 1
              }
            },
            {
              Key: 2,
              Value: {
                Name: "20-2",
                Up_Pose: 133.2,
                Down_Pose: 1
              }
            },

          ]
        },
      ],
      OriDataJson: undefined,
      HasAnyChange: false,
      loading: false,
    }
  },
  watch: {
    HasAnyChange(currentVal, oldValue) {
      ForkTeachStore.commit('setIsAnyChanged', currentVal)
    }
  },
  computed: {
    NewTagNumber() {
      var teachDataLen = this.TeachDatas.length;
      if (teachDataLen == 0)
        return 1;

      return this.TeachDatas[teachDataLen - 1].Tag + 1;
    },
    NewTagLayerDataTemplate() {
      var teachDataLen = this.TeachDatas.length;
      if (teachDataLen == 0)
        return [
          {
            Key: 0,
            Value: {
              Name: "1-0",
              Up_Pose: 12.2,
              Down_Pose: 9
            }
          },
          {
            Key: 1,
            Value: {
              Name: "1-1",
              Up_Pose: 12.2,
              Down_Pose: 9
            }
          },
          {
            Key: 2,
            Value: {
              Name: "1-2",
              Up_Pose: 12.2,
              Down_Pose: 9
            }
          },
        ];
      return JSON.parse(JSON.stringify(this.TeachDatas[teachDataLen - 1].Layers)); //deep clone
    },
  },
  methods: {
    reload() {
      this.LoadTeachDataFromServer()
      this.HasAnyChange = false;
    },
    async LoadTeachDataFromServer() {
      this.loading = true;
      setTimeout(async () => {
        try {

          this.TeachDatas = await ForkAPI.GetTeachData()
          this.loading = false;
          this.ResetOriDattaString();
        } catch (error) {

          this.loading = false;
        }
      }, 100);
    },
    async SaveHandler() {

      const transformedData = {};
      this.TeachDatas.forEach((item) => {
        const tag = item.Tag.toString();
        transformedData[tag] = {};

        item.Layers.forEach((layer) => {
          const key = layer.Key.toString();
          transformedData[tag][key] = layer.Value;

        });
      });
      this.ResetOriDattaString();
      this.InputChanged();
      var response = await ForkAPI.SaveTeachData(transformedData)
      if (response.confirm) {
        this.LoadTeachDataFromServer()
        this.HasAnyChange = false;
        this.$swal.fire({
          icon: 'success',
          title: 'Fork Teach Data Save',
          text: '儲存成功!'
        })
      }
    },
    InputChanged() {
      //'[{"Tag":8,"Layers":[{"Key":0,"Value":{"Name":"10-0","Up_Pose":12.42,"Down_Pose":12.03}},{"Key":1,"Value":{"Name":"10-1","Up_Pose":23.3,"Down_Pose":22.1}},{"Key":2,"Value":{"Name":"10-2","Up_Pose":123.3,"Down_Pose":121.1}}]}]'
      var currentJson = this.GetNonCommString(this.TeachDatas)
      this.HasAnyChange = currentJson != this.OriDataJson;

    },
    InputClicked(ele) {
      console.log(ele)
    },
    AddTagTeachHandler() {
      this.TeachDatas.push({
        Tag: this.NewTagNumber,
        Layers: this.NewTagLayerDataTemplate
      })
      this.HasAnyChange = true;
    },
    RemoveTagTeachSetting(tagTeach) {
      var index = this.TeachDatas.indexOf(tagTeach)
      this.TeachDatas.splice(index, 1)
      this.InputChanged();
      this.HasAnyChange = true;
    },
    GetNonCommString(object) {
      return JSON.stringify(object).replaceAll('\"', '')
    },
    ResetOriDattaString() {
      this.OriDataJson = this.GetNonCommString(this.TeachDatas)
      this.HasAnyChange = false;
    }
  },
  mounted() {
    this.reload();
  },
}
</script>

<style lang="scss" scoped>
</style>