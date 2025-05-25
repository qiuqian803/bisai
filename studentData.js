// 学生数据传递工具
const StudentData = {
    // 保存学生数据到本地存储
    saveStudent: function(student) {
        if (student && student.name) {
            localStorage.setItem('selectedStudent', JSON.stringify(student));
            return true;
        }
        return false;
    },
    
    // 获取保存的学生数据
    getStudent: function() {
        const data = localStorage.getItem('selectedStudent');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('解析学生数据失败:', e);
                return null;
            }
        }
        return null;
    }
};