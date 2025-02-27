

增加新事件
     serverData.updateUserInfo.mutate({type:'addNewEvent',newUserInfo:{kidinfo:[{kidId:1,name:'test',gender:'male',birthday:'2020-01-01',avatar:''}]}})

关注用户
     serverData.UserOperation.followUser({targetUserId:1,callback:(success,message)=>{
        if(success){
            console.log('关注成功')
        }else{
            console.log('关注失败')
        }
     }})
