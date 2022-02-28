# desktop-owl
내 데스크탑 속 펫 Desktop Owl 입니다.

### 로컬에서 실행

`yarn install && yarn e`

### 윈도우 빌드

`yarn build:win`

### 맥 빌드

`yarn build:osx`

###### 맥 버전 빌드는 맥OS에서만 동작합니다.  

## Todo List
- [x] 여러 마리 데려오기 (v1.0.2)
- [x] 싱글 인스턴스로 동작 (v1.0.3)
- [x] 자체 확장자 파싱(.doa) (v1.0.4)
- [x] 행동 커스터마이징 (v1.0.5)
- [x] 커스텀 json 추가 (v1.0.5)
- [ ] 스트리밍용 화면 구현
- [ ] 코드 이쁘게 만들기

## 커스텀 캐릭터 만들기
![image](https://user-images.githubusercontent.com/21301787/155934406-853f37c9-feb0-48ab-b041-3a2894329bff.png)

1. 위와 같은 형태의 이미지 12장 준비
2. 각 파일의 이름 매칭
3. 해당 파일들이 담긴 폴더 zip으로 압축 
4. zip파일 확장자를 doa로 변경
###### 각 이미지는 100x100 투명도가 있는 png입니다.

doa 파일을 실행하거나 실행중인 desktop-owl 프로그램에 doa 파일을 드래그&드롭 하여 적용할 수 있습니다.
