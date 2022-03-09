# petitcon
내 데스크탑 속 펫 petitcon 입니다.

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
- [x] 자체 확장자 파싱(.ptc) (v1.0.4)
- [x] 행동 커스터마이징 (v1.0.5)
- [x] 커스텀 json 추가 (v1.0.5)
- [ ] 스트리밍용 화면 구현
- [ ] 코드 이쁘게 만들기

## 커스텀 캐릭터 만들기
![image](https://user-images.githubusercontent.com/21301787/155934406-853f37c9-feb0-48ab-b041-3a2894329bff.png)

1. 위와 같은 형태의 이미지 12장 준비
2. 각 파일의 이름 매칭
3. 해당 파일들이 담긴 폴더 zip으로 압축 
4. zip파일 확장자를 ptc로 변경
###### 각 이미지는 100x100 투명도가 있는 png입니다.

ptc 파일을 실행하거나 실행중인 petitcon 프로그램에 ptc 파일을 드래그&드롭 하여 적용할 수 있습니다.

## 커스텀 쁘띠콘 만들기

[쁘띠콘 에디터(베타)](https://petitcon.esllo.com/)

## 커스텀 행동 json  만들기

아래와 같은 형태로 커스텀 행동을 만들 수 있습니다. 

`behaviors.json`
```js
{
  "name": "mokoko",
  "author": "esllo",
  "behaviors": [
    {
      "action": "fall",
      "condition": "isNotGround",
      "duration": [15, 30],
      "durationRange": {
        "fixed": 10000
      },
      "evaluate": [
        {
          "variable": "falling",
          "value": true
        }
      ]
    }, 
    {
      "action": "climb",
      "condition": "hasNeerWall",
      "chance": 60,
      "duration": [20, 40],
      "durationRange": {
        "min": 6,
        "max": 12,
        "multiply": 40
      },
      "evaluate": [
        {
          "func": "dockToNeerWall"
        },
        {
          "variable": "velY",
          "value": -0.7
        }
      ]
    }, 
    {
      "action": "walk",
      "chance": 40 ,
      "duration": [20, 40, 60, 80],
      "durationRange": {
        "min": 2,
        "max": 12,
        "multiply": 40
      },
      "evaluate": [
        {
          "func": "setRandomDirection"
        },
        {
          "variable": "velX",
          "key": "direction"
        }
      ]
    },
    {
      "action": "sneeze",
      "chance": 30 ,
      "duration": [60, 90, 120],
      "durationRange": {
        "fixed": 120
      }
    },
    {
      "action": "sit",
      "chance": 30 ,
      "duration": [],
      "durationRange": {
        "min": 3,
        "max": 4,
        "multiply": 20
      }
    },
    {
      "action": "stand",
      "chance": 100,
      "duration": [],
      "durationRange": {
        "min": 2,
        "max": 5,
        "multiply": 30
      }
    }
  ]
}
```

위의 `behaviors.json` 파일을 `.ptc` 파일에 넣어 실행하면 v1.0.5 부터 커스텀 동작을 확인할 수 있습니다.
