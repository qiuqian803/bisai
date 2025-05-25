// 全局变量
let currentDifficulty = 'easy';
let currentQuestionIndex = -1;
let questionBank = {
    easy: [],
    medium: [],
    hard: []
};
let mediaFiles = {
    image: null,
    audio: null,
    video: null
};

// DOM元素
const elements = {
    questionList: document.getElementById('questionList'),
    questionText: document.getElementById('questionText'),
    optionsContainer: document.getElementById('optionsContainer'),
    explanation: document.getElementById('explanation'),
    difficultyBtns: document.querySelectorAll('.btn-difficulty'),
    addNewBtn: document.getElementById('addNewQuestion'),
    saveChangesBtn: document.getElementById('saveChanges'),
    backToMainBtn: document.getElementById('backToMain'),
    searchInput: document.getElementById('searchQuestion'),
    mediaTabs: document.querySelectorAll('.media-tab'),
    mediaPanels: document.querySelectorAll('.media-panel'),
    imageUpload: document.getElementById('imageUpload'),
    audioUpload: document.getElementById('audioUpload'),
    videoUpload: document.getElementById('videoUpload'),
    imagePreview: document.getElementById('imagePreview'),
    audioPreview: document.getElementById('audioPreview'),
    videoPreview: document.getElementById('videoPreview'),
    uploadImageBtn: document.getElementById('uploadImageBtn'),
    uploadAudioBtn: document.getElementById('uploadAudioBtn'),
    uploadVideoBtn: document.getElementById('uploadVideoBtn'),
    confirmModal: document.getElementById('confirmModal'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmAction: document.getElementById('confirmAction'),
    cancelAction: document.getElementById('cancelAction'),
    closeModal: document.querySelector('.close-modal'),
    toast: document.getElementById('toast')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadQuestionBank();
    setupEventListeners();
});

// 加载题库
function loadQuestionBank() {
    // 尝试从localStorage加载题库
    const savedQuestionBank = localStorage.getItem('questionBank');
    
    if (savedQuestionBank) {
        questionBank = JSON.parse(savedQuestionBank);
    } else {
        // 从原始HTML文件中提取题库
        fetch('扭蛋大作战v2.1.2.html')
            .then(response => response.text())
            .then(html => {
                // 提取题库数据
                extractQuestionBank(html);
                // 更新题目列表
                updateQuestionList();
            })
            .catch(error => {
                showToast('加载题库失败: ' + error.message);
                console.error('加载题库失败:', error);
            });
    }
    
    // 更新题目列表
    updateQuestionList();
}

// 从HTML中提取题库
function extractQuestionBank(html) {
    try {
        // 提取简单题库
        const easyMatch = html.match(/let easyQuestions = \[([\s\S]*?)\];/);
        if (easyMatch && easyMatch[1]) {
            questionBank.easy = JSON.parse('[' + easyMatch[1] + ']');
        }
        
        // 提取中等题库
        const mediumMatch = html.match(/let mediumQuestions = \[([\s\S]*?)\];/);
        if (mediumMatch && mediumMatch[1]) {
            questionBank.medium = JSON.parse('[' + mediumMatch[1] + ']');
        }
        
        // 提取困难题库
        const hardMatch = html.match(/let hardQuestions = \[([\s\S]*?)\];/);
        if (hardMatch && hardMatch[1]) {
            questionBank.hard = JSON.parse('[' + hardMatch[1] + ']');
        }
        
        // 保存到localStorage
        localStorage.setItem('questionBank', JSON.stringify(questionBank));
        
        showToast('题库加载成功');
    } catch (error) {
        showToast('解析题库失败: ' + error.message);
        console.error('解析题库失败:', error);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 难度选择按钮
    elements.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.difficultyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
            currentQuestionIndex = -1;
            updateQuestionList();
            clearEditor();
        });
    });
    
    // 添加新题目按钮
    elements.addNewBtn.addEventListener('click', () => {
        currentQuestionIndex = -1;
        clearEditor();
        showToast('请编辑新题目');
    });
    
    // 保存更改按钮
    elements.saveChangesBtn.addEventListener('click', saveCurrentQuestion);
    
    // 返回主页按钮
    elements.backToMainBtn.addEventListener('click', () => {
        showConfirmModal('确定要返回主页吗？未保存的更改将丢失。', () => {
            window.location.href = '扭蛋大作战v2.1.2.html';
        });
    });
    
    // 搜索输入框
    elements.searchInput.addEventListener('input', () => {
        updateQuestionList();
    });
    
    // 媒体标签页切换
    elements.mediaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.mediaTabs.forEach(t => t.classList.remove('active'));
            elements.mediaPanels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`${tabId}Panel`).classList.add('active');
        });
    });
    
    // 上传按钮
    elements.uploadImageBtn.addEventListener('click', () => elements.imageUpload.click());
    elements.uploadAudioBtn.addEventListener('click', () => elements.audioUpload.click());
    elements.uploadVideoBtn.addEventListener('click', () => elements.videoUpload.click());
    
    // 文件上传处理
    elements.imageUpload.addEventListener('change', handleFileUpload);
    elements.audioUpload.addEventListener('change', handleFileUpload);
    elements.videoUpload.addEventListener('change', handleFileUpload);
    
    // 模态框关闭
    elements.closeModal.addEventListener('click', () => {
        elements.confirmModal.style.display = 'none';
    });
    
    elements.cancelAction.addEventListener('click', () => {
        elements.confirmModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) {
            elements.confirmModal.style.display = 'none';
        }
    });
}

// 更新题目列表
function updateQuestionList() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const questions = questionBank[currentDifficulty];
    
    elements.questionList.innerHTML = '';
    
    if (questions.length === 0) {
        elements.questionList.innerHTML = '<div class="empty-list">暂无题目</div>';
        return;
    }
    
    questions.forEach((question, index) => {
        if (searchTerm && !question.question.toLowerCase().includes(searchTerm)) {
            return;
        }
        
        const item = document.createElement('div');
        item.className = 'question-item';
        if (index === currentQuestionIndex) {
            item.classList.add('active');
        }
        
        // 截取题目前30个字符
        const shortQuestion = question.question.length > 30 
            ? question.question.substring(0, 30) + '...' 
            : question.question;
            
        item.textContent = `${index + 1}. ${shortQuestion}`;
        
        item.addEventListener('click', () => {
            selectQuestion(index);
        });
        
        elements.questionList.appendChild(item);
    });
}

// 选择题目
function selectQuestion(index) {
    currentQuestionIndex = index;
    updateQuestionList();
    
    const question = questionBank[currentDifficulty][index];
    if (!question) return;
    
    // 填充编辑器
    elements.questionText.value = question.question;
    elements.explanation.value = question.explanation || '';
    
    // 填充选项
    const optionInputs = elements.optionsContainer.querySelectorAll('.option-text');
    const radioInputs = elements.optionsContainer.querySelectorAll('input[type="radio"]');
    
    question.options.forEach((option, i) => {
        if (optionInputs[i]) {
            optionInputs[i].value = option;
        }
    });
    
    // 设置正确答案
    radioInputs.forEach(radio => {
        radio.checked = radio.value === question.answer;
    });
    
    // 清除媒体预览
    clearMediaPreviews();
    
    // 如果有媒体资源，加载预览
    if (question.media) {
        if (question.media.image) {
            showMediaPreview('image', question.media.image);
        }
        if (question.media.audio) {
            showMediaPreview('audio', question.media.audio);
        }
        if (question.media.video) {
            showMediaPreview('video', question.media.video);
        }
    }
}

// 清除编辑器
function clearEditor() {
    elements.questionText.value = '';
    elements.explanation.value = '';
    
    // 清除选项
    const optionInputs = elements.optionsContainer.querySelectorAll('.option-text');
    optionInputs.forEach(input => {
        input.value = '';
    });
    
    // 清除正确答案选择
    const radioInputs = elements.optionsContainer.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(radio => {
        radio.checked = false;
    });
    
    // 清除媒体预览
    clearMediaPreviews();
    mediaFiles = {
        image: null,
        audio: null,
        video: null
    };
}

// 清除媒体预览
function clearMediaPreviews() {
    elements.imagePreview.innerHTML = '预览区域';
    elements.audioPreview.innerHTML = '预览区域';
    elements.videoPreview.innerHTML = '预览区域';
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = event.target.id.replace('Upload', '');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        mediaFiles[fileType] = {
            data: e.target.result,
            name: file.name,
            type: file.type
        };
        
        showMediaPreview(fileType, e.target.result);
    };
    
    reader.readAsDataURL(file);
}

// 显示媒体预览
function showMediaPreview(type, data) {
    const previewElement = elements[`${type}Preview`];
    previewElement.innerHTML = '';
    
    switch(type) {
        case 'image':
            const img = document.createElement('img');
            img.src = data;
            previewElement.appendChild(img);
            break;
            
        case 'audio':
            const audio = document.createElement('audio');
            audio.src = data;
            audio.controls = true;
            previewElement.appendChild(audio);
            break;
            
        case 'video':
            const video = document.createElement('video');
            video.src = data;
            video.controls = true;
            previewElement.appendChild(video);
            break;
    }
}

// 保存当前题目
function saveCurrentQuestion() {
    // 获取表单数据
    const questionText = elements.questionText.value.trim();
    if (!questionText) {
        showToast('题目内容不能为空');
        return;
    }
    
    // 获取选项
    const optionInputs = elements.optionsContainer.querySelectorAll('.option-text');
    const options = [];
    let hasEmptyOption = false;
    
    optionInputs.forEach(input => {
        const optionText = input.value.trim();
        if (!optionText) {
            hasEmptyOption = true;
        }
        options.push(optionText);
    });
    
    if (hasEmptyOption) {
        showToast('选项内容不能为空');
        return;
    }
    
    // 获取正确答案
    const selectedRadio = elements.optionsContainer.querySelector('input[type="radio"]:checked');
    if (!selectedRadio) {
        showToast('请选择正确答案');
        return;
    }
    
    const answer = selectedRadio.value;
    
    // 获取解析
    const explanation = elements.explanation.value.trim();
    
    // 构建题目对象
    const questionObj = {
        question: questionText,
        options: options,
        answer: answer,
        explanation: explanation
    };
    
    // 添加媒体资源
    if (mediaFiles.image || mediaFiles.audio || mediaFiles.video) {
        questionObj.media = {};
        
        if (mediaFiles.image) {
            questionObj.media.image = mediaFiles.image.data;
        }
        
        if (mediaFiles.audio) {
            questionObj.media.audio = mediaFiles.audio.data;
        }
        
        if (mediaFiles.video) {
            questionObj.media.video = mediaFiles.video.data;
        }
    }
    
    // 保存题目
    if (currentQuestionIndex === -1) {
        // 添加新题目
        questionBank[currentDifficulty].push(questionObj);
        currentQuestionIndex = questionBank[currentDifficulty].length - 1;
        showToast('新题目添加成功');
    } else {
        // 更新现有题目
        questionBank[currentDifficulty][currentQuestionIndex] = questionObj;
        showToast('题目更新成功');
    }
    
    // 保存到localStorage
    localStorage.setItem('questionBank', JSON.stringify(questionBank));
    
    // 更新题目列表
    updateQuestionList();
    
    // 生成题库文件
    generateQuestionBankFile();
}

// 生成题库文件
function generateQuestionBankFile() {
    // 构建题库JS代码
    let jsContent = `// 题库数据 - 由题库管理器自动生成\n\n`;
    
    // 添加简单题库
    jsContent += `// 简单难度题库\nlet easyQuestions = [\n`;
    questionBank.easy.forEach((q, i) => {
        jsContent += `    {\n`;
        jsContent += `      "question": ${JSON.stringify(q.question)},\n`;
        jsContent += `      "options": ${JSON.stringify(q.options)},\n`;
        jsContent += `      "answer": ${JSON.stringify(q.answer)},\n`;
        jsContent += `      "explanation": ${JSON.stringify(q.explanation)}\n`;
        
        // 添加媒体资源
        if (q.media) {
            jsContent += `      ,\n      "media": {\n`;
            
            if (q.media.image) {
                jsContent += `        "image": ${JSON.stringify(q.media.image)},\n`;
            }
            
            if (q.media.audio) {
                jsContent += `        "audio": ${JSON.stringify(q.media.audio)},\n`;
            }
            
            if (q.media.video) {
                jsContent += `        "video": ${JSON.stringify(q.media.video)}\n`;
            }
            
            jsContent += `      }\n`;
        }
        
        jsContent += `    }${i < questionBank.easy.length - 1 ? ',' : ''}\n`;
    });
    jsContent += `];\n\n`;
    
    // 添加中等题库
    jsContent += `// 中等难度题库\nlet mediumQuestions = [\n`;
    questionBank.medium.forEach((q, i) => {
        jsContent += `    {\n`;
        jsContent += `      "question": ${JSON.stringify(q.question)},\n`;
        jsContent += `      "options": ${JSON.stringify(q.options)},\n`;
        jsContent += `      "answer": ${JSON.stringify(q.answer)},\n`;
        jsContent += `      "explanation": ${JSON.stringify(q.explanation)}\n`;
        
        // 添加媒体资源
        if (q.media) {
            jsContent += `      ,\n      "media": {\n`;
            
            if (q.media.image) {
                jsContent += `        "image": ${JSON.stringify(q.media.image)},\n`;
            }
            
            if (q.media.audio) {
                jsContent += `        "audio": ${JSON.stringify(q.media.audio)},\n`;
            }
            
            if (q.media.video) {
                jsContent += `        "video": ${JSON.stringify(q.media.video)}\n`;
            }
            
            jsContent += `      }\n`;
        }
        
        jsContent += `    }${i < questionBank.medium.length - 1 ? ',' : ''}\n`;
    });
    jsContent += `];\n\n`;
    
    // 添加困难题库
    jsContent += `// 困难难度题库\nlet hardQuestions = [\n`;
    questionBank.hard.forEach((q, i) => {
        jsContent += `    {\n`;
        jsContent += `      "question": ${JSON.stringify(q.question)},\n`;
        jsContent += `      "options": ${JSON.stringify(q.options)},\n`;
        jsContent += `      "answer": ${JSON.stringify(q.answer)},\n`;
        jsContent += `      "explanation": ${JSON.stringify(q.explanation)}\n`;
        
        // 添加媒体资源
        if (q.media) {
            jsContent += `      ,\n      "media": {\n`;
            
            if (q.media.image) {
                jsContent += `        "image": ${JSON.stringify(q.media.image)},\n`;
            }
            
            if (q.media.audio) {
                jsContent += `        "audio": ${JSON.stringify(q.media.audio)},\n`;
            }
            
            if (q.media.video) {
                jsContent += `        "video": ${JSON.stringify(q.media.video)}\n`;
            }
            
            jsContent += `      }\n`;
        }
        
        jsContent += `    }${i < questionBank.hard.length - 1 ? ',' : ''}\n`;
    });
    jsContent += `];\n`;
    
    // 创建下载链接
    const blob = new Blob([jsContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    // 检查是否已存在下载按钮
    let downloadBtn = document.getElementById('downloadQuestionBank');
    
    if (!downloadBtn) {
        downloadBtn = document.createElement('a');
        downloadBtn.id = 'downloadQuestionBank';
        downloadBtn.className = 'btn btn-primary';
        downloadBtn.style.position = 'fixed';
        downloadBtn.style.bottom = '20px';
        downloadBtn.style.right = '20px';
        downloadBtn.style.zIndex = '1000';
        downloadBtn.textContent = '下载题库文件';
        document.body.appendChild(downloadBtn);
    }
    
    downloadBtn.href = url;
    downloadBtn.download = 'questionBank.js';
}

// 显示确认对话框
function showConfirmModal(message, confirmCallback) {
    elements.confirmMessage.textContent = message;
    elements.confirmModal.style.display = 'flex';
    
    // 移除旧的事件监听器
    const newConfirmBtn = elements.confirmAction.cloneNode(true);
    elements.confirmAction.parentNode.replaceChild(newConfirmBtn, elements.confirmAction);
    elements.confirmAction = newConfirmBtn;
    
    // 添加新的事件监听器
    elements.confirmAction.addEventListener('click', () => {
        elements.confirmModal.style.display = 'none';
        if (confirmCallback) {
            confirmCallback();
        }
    });
}

// 显示提示消息
function showToast(message, duration = 3000) {
    elements.toast.textContent = message;
    elements.toast.style.display = 'block';
    
    setTimeout(() => {
        elements.toast.style.display = 'none';
    }, duration);
}

// 删除当前题目
function deleteCurrentQuestion() {
    if (currentQuestionIndex === -1) {
        showToast('没有选中的题目');
        return;
    }
    
    showConfirmModal('确定要删除这个题目吗？此操作不可撤销。', () => {
        questionBank[currentDifficulty].splice(currentQuestionIndex, 1);
        localStorage.setItem('questionBank', JSON.stringify(questionBank));
        
        currentQuestionIndex = -1;
        clearEditor();
        updateQuestionList();
        showToast('题目已删除');
        
        // 更新题库文件
        generateQuestionBankFile();
    });
}

// 导出题库到HTML文件
function exportToHTML() {
    // 读取原始HTML文件
    fetch('扭蛋大作战v2.1.2.html')
        .then(response => response.text())
        .then(html => {
            // 替换题库数据
            let updatedHtml = html;
            
            // 替换简单题库
            const easyMatch = updatedHtml.match(/let easyQuestions = \[([\s\S]*?)\];/);
            if (easyMatch) {
                let easyContent = '';
                questionBank.easy.forEach((q, i) => {
                    easyContent += `    {\n`;
                    easyContent += `      "question": ${JSON.stringify(q.question)},\n`;
                    easyContent += `      "options": ${JSON.stringify(q.options)},\n`;
                    easyContent += `      "answer": ${JSON.stringify(q.answer)},\n`;
                    easyContent += `      "explanation": ${JSON.stringify(q.explanation)}`;
                    
                    // 添加媒体资源
                    if (q.media) {
                        easyContent += `,\n      "media": {\n`;
                        
                        if (q.media.image) {
                            easyContent += `        "image": ${JSON.stringify(q.media.image)},\n`;
                        }
                        
                        if (q.media.audio) {
                            easyContent += `        "audio": ${JSON.stringify(q.media.audio)},\n`;
                        }
                        
                        if (q.media.video) {
                            easyContent += `        "video": ${JSON.stringify(q.media.video)}\n`;
                        }
                        
                        easyContent += `      }`;
                    }
                    
                    easyContent += `\n    }${i < questionBank.easy.length - 1 ? ',' : ''}`;
                    if (i < questionBank.easy.length - 1) {
                        easyContent += '\n';
                    }
                });
                
                updatedHtml = updatedHtml.replace(easyMatch[0], `let easyQuestions = [\n${easyContent}\n];`);
            }
            
            // 替换中等题库
            const mediumMatch = updatedHtml.match(/let mediumQuestions = \[([\s\S]*?)\];/);
            if (mediumMatch) {
                let mediumContent = '';
                questionBank.medium.forEach((q, i) => {
                    mediumContent += `    {\n`;
                    mediumContent += `      "question": ${JSON.stringify(q.question)},\n`;
                    mediumContent += `      "options": ${JSON.stringify(q.options)},\n`;
                    mediumContent += `      "answer": ${JSON.stringify(q.answer)},\n`;
                    mediumContent += `      "explanation": ${JSON.stringify(q.explanation)}`;
                    
                    // 添加媒体资源
                    if (q.media) {
                        mediumContent += `,\n      "media": {\n`;
                        
                        if (q.media.image) {
                            mediumContent += `        "image": ${JSON.stringify(q.media.image)},\n`;
                        }
                        
                        if (q.media.audio) {
                            mediumContent += `        "audio": ${JSON.stringify(q.media.audio)},\n`;
                        }
                        
                        if (q.media.video) {
                            mediumContent += `        "video": ${JSON.stringify(q.media.video)}\n`;
                        }
                        
                        mediumContent += `      }`;
                    }
                    
                    mediumContent += `\n    }${i < questionBank.medium.length - 1 ? ',' : ''}`;
                    if (i < questionBank.medium.length - 1) {
                        mediumContent += '\n';
                    }
                });
                
                updatedHtml = updatedHtml.replace(mediumMatch[0], `let mediumQuestions = [\n${mediumContent}\n];`);
            }
            
            // 替换困难题库
            const hardMatch = updatedHtml.match(/let hardQuestions = \[([\s\S]*?)\];/);
            if (hardMatch) {
                let hardContent = '';
                questionBank.hard.forEach((q, i) => {
                    hardContent += `    {\n`;
                    hardContent += `      "question": ${JSON.stringify(q.question)},\n`;
                    hardContent += `      "options": ${JSON.stringify(q.options)},\n`;
                    hardContent += `      "answer": ${JSON.stringify(q.answer)},\n`;
                    hardContent += `      "explanation": ${JSON.stringify(q.explanation)}`;
                    
                    // 添加媒体资源
                    if (q.media) {
                        hardContent += `,\n      "media": {\n`;
                        
                        if (q.media.image) {
                            hardContent += `        "image": ${JSON.stringify(q.media.image)},\n`;
                        }
                        
                        if (q.media.audio) {
                            hardContent += `        "audio": ${JSON.stringify(q.media.audio)},\n`;
                        }
                        
                        if (q.media.video) {
                            hardContent += `        "video": ${JSON.stringify(q.media.video)}\n`;
                        }
                        
                        hardContent += `      }`;
                    }
                    
                    hardContent += `\n    }${i < questionBank.hard.length - 1 ? ',' : ''}`;
                    if (i < questionBank.hard.length - 1) {
                        hardContent += '\n';
                    }
                });
                
                updatedHtml = updatedHtml.replace(hardMatch[0], `let hardQuestions = [\n${hardContent}\n];`);
            }
            
            // 创建下载链接
            const blob = new Blob([updatedHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = '扭蛋大作战v2.1.2_更新版.html';
            downloadLink.click();
            
            showToast('HTML文件导出成功');
        })
        .catch(error => {
            showToast('导出失败: ' + error.message);
            console.error('导出失败:', error);
        });
}

// 添加删除按钮和导出按钮
function addActionButtons() {
    // 添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = '删除当前题目';
    deleteBtn.style.marginTop = '20px';
    deleteBtn.addEventListener('click', deleteCurrentQuestion);
    
    // 添加导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-success';
    exportBtn.textContent = '导出到HTML';
    exportBtn.style.marginTop = '20px';
    exportBtn.style.marginLeft = '10px';
    exportBtn.addEventListener('click', exportToHTML);
    
    // 添加按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'space-between';
    btnContainer.appendChild(deleteBtn);
    btnContainer.appendChild(exportBtn);
    
    // 添加到编辑器底部
    const editorBody = document.querySelector('.editor-body');
    editorBody.appendChild(btnContainer);
}

// 初始化时添加操作按钮
document.addEventListener('DOMContentLoaded', () => {
    addActionButtons();
});