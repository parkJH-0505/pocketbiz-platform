const fs = require('fs');
const path = require('path');
const os = require('os');

// Claude 세션 폴더 경로
const projectsPath = path.join(os.homedir(), '.claude', 'projects');

// 현재 프로젝트 폴더 찾기
function getCurrentProjectFolder() {
  const currentDir = process.cwd().replace(/\\/g, '-').replace(/:/g, '-');
  const folders = fs.readdirSync(projectsPath);

  console.log('현재 디렉토리:', process.cwd());
  console.log('사용 가능한 프로젝트 폴더들:');
  folders.forEach(folder => console.log(' -', folder));

  // 현재 경로와 정확히 매칭되는 폴더 찾기
  const matchingFolder = folders.find(folder =>
    folder.includes('my-startup-app-my-startup-app') ||
    folder.includes(currentDir.toLowerCase()) ||
    folder.endsWith('my-startup-app-my-startup-app')
  );

  if (matchingFolder) {
    console.log('선택된 폴더:', matchingFolder);
    return path.join(projectsPath, matchingFolder);
  }

  // 못 찾으면 가장 최근 폴더 사용
  const latestFolder = folders[folders.length - 1];
  console.log('기본값으로 사용할 폴더:', latestFolder);
  return path.join(projectsPath, latestFolder);
}

// 세션 목록 가져오기
function listSessions() {
  try {
    const projectFolder = getCurrentProjectFolder();
    const files = fs.readdirSync(projectFolder);

    // .jsonl 파일들만 필터링하고 정보 수집
    const sessions = files
      .filter(file => file.endsWith('.jsonl'))
      .map(file => {
        const filePath = path.join(projectFolder, file);
        const stats = fs.statSync(filePath);
        const sessionId = file.replace('.jsonl', '');

        // 파일 크기를 KB/MB로 변환
        let size = stats.size;
        let sizeUnit = 'B';
        if (size > 1024) {
          size = (size / 1024).toFixed(1);
          sizeUnit = 'KB';
        }
        if (size > 1024) {
          size = (size / 1024).toFixed(1);
          sizeUnit = 'MB';
        }

        // 마지막 수정 시간
        const lastModified = stats.mtime;
        const now = new Date();
        const diffMinutes = Math.floor((now - lastModified) / (1000 * 60));

        let timeAgo;
        if (diffMinutes < 60) {
          timeAgo = `${diffMinutes}m ago`;
        } else {
          const diffHours = Math.floor(diffMinutes / 60);
          timeAgo = `${diffHours}h ago`;
        }

        return {
          sessionId,
          size: `${size}${sizeUnit}`,
          timeAgo,
          lastModified
        };
      })
      // 최근 수정 순으로 정렬
      .sort((a, b) => b.lastModified - a.lastModified);

    console.log('\n📋 Claude 세션 목록:');
    console.log('='.repeat(50));

    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.sessionId}`);
      console.log(`   크기: ${session.size} | 마지막 사용: ${session.timeAgo}`);
      console.log('');
    });

    console.log('🚀 사용법:');
    console.log(`claude --resume <session-id>`);
    console.log('\n예시:');
    if (sessions.length > 0) {
      console.log(`claude --resume ${sessions[0].sessionId}`);
    }

  } catch (error) {
    console.error('❌ 세션 목록을 가져올 수 없습니다:', error.message);
  }
}

listSessions();