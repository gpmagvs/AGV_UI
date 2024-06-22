import axios_entity from '@/axios';

export async function Login(user) {
  var ret = await axios_entity.post('api/User/Login', user)
  StoreToLocalStorage(ret.data)
  return ret.data
}

function StoreToLocalStorage(user) {
  user.LoginTime = Date.now()
  localStorage.setItem('user', JSON.stringify(user))
}
