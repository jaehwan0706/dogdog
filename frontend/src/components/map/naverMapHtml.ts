// WebView 안에서 실행되는 지도 페이지 (네이버 지도 JavaScript API v3)
// 앱 → 지도: window.__fromApp({ type: 'location', ... }) 를 injectJavaScript 로 호출
// 지도 → 앱: window.ReactNativeWebView.postMessage(JSON 문자열)
// 웹(브라우저)은 이 페이지를 쓰지 않고 NaverWebMap.web.tsx 가 페이지에 지도를 직접 띄움

export type MapCamera = { latitude: number; longitude: number; zoom: number };

export function naverMapScriptUrl(clientId: string) {
  return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
}

// 내 위치 점 / 오차 원 색
export const MY_LOCATION_COLOR = '#2F80ED';

// 사진 핀 마커: 둥근 썸네일 + 아래 꼬리. 앵커는 꼬리 끝 (앱·웹 공통)
export const PHOTO_PIN_SIZE = 44;
export const PHOTO_PIN_BORDER = '#184D3B';
export const PHOTO_PIN_ANCHOR = { x: PHOTO_PIN_SIZE / 2 + 3, y: PHOTO_PIN_SIZE + 12 };
export const PHOTO_PIN_CSS = `
  .pin { position: relative; width: ${PHOTO_PIN_SIZE}px; height: ${PHOTO_PIN_SIZE}px; border: 3px solid ${PHOTO_PIN_BORDER}; border-radius: 50%; background: #EAF0EC; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); cursor: pointer; }
  .pin img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
  .pin::after { content: ''; position: absolute; left: 50%; bottom: -10px; margin-left: -6px; border: 6px solid transparent; border-top: 6px solid ${PHOTO_PIN_BORDER}; }
`;

export function buildNaverMapHtml(clientId: string, camera: MapCamera) {
  const scriptUrl = naverMapScriptUrl(clientId);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
  /* 길게 눌렀을 때 텍스트 선택·복사 메뉴가 뜨지 않도록 */
  body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  .me { width: 14px; height: 14px; border-radius: 50%; background: ${MY_LOCATION_COLOR}; border: 3px solid #fff; box-shadow: 0 0 4px rgba(0, 0, 0, 0.35); }
  ${PHOTO_PIN_CSS}
</style>
<script>
  function post(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  // Client ID 가 틀렸거나 Web 서비스 URL 이 등록되지 않으면 네이버 SDK 가 이 함수를 호출함
  window.navermap_authFailure = function () {
    post({ type: 'authFailure' });
  };
</script>
<script src="${scriptUrl}" onerror="post({ type: 'loadError' })"></script>
</head>
<body>
<div id="map"></div>
<script>
  (function () {
    if (!window.naver || !naver.maps) {
      post({ type: 'loadError' });
      return;
    }

    var map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(${camera.latitude}, ${camera.longitude}),
      zoom: ${camera.zoom},
      zoomControl: false,
      scaleControl: false,
      mapDataControl: false,
    });
    var myMarker = null;
    var myCircle = null;

    // 사용자가 지도를 직접 움직이면 앱에 알려서 "내 위치 따라가기"를 끔
    naver.maps.Event.addListener(map, 'dragstart', function () {
      post({ type: 'userGesture' });
    });

    function updateMyLocation(message) {
      var position = new naver.maps.LatLng(message.latitude, message.longitude);
      if (!myMarker) {
        myMarker = new naver.maps.Marker({
          map: map,
          position: position,
          icon: { content: '<div class="me"></div>', anchor: new naver.maps.Point(10, 10) },
          zIndex: 100,
        });
        myCircle = new naver.maps.Circle({
          map: map,
          center: position,
          radius: 0,
          strokeOpacity: 0,
          fillColor: '${MY_LOCATION_COLOR}',
          fillOpacity: 0.15,
          clickable: false,
        });
      } else {
        myMarker.setPosition(position);
        myCircle.setCenter(position);
      }
      myCircle.setRadius(message.accuracy || 0);
      if (message.follow) {
        map.panTo(position);
      }
    }

    // 사진 핀: 목록이 바뀔 때마다 전부 지우고 다시 그림 (개인 기록이라 개수가 많지 않음)
    var photoMarkers = [];
    function updatePhotoPins(pins) {
      photoMarkers.forEach(function (marker) { marker.setMap(null); });
      photoMarkers = pins.map(function (pin) {
        // 이미지 주소는 문자열로 HTML 에 끼워 넣지 않고 DOM 으로 만들어서 넣음
        var element = document.createElement('div');
        element.className = 'pin';
        var image = document.createElement('img');
        image.src = pin.imageUrl;
        element.appendChild(image);
        var marker = new naver.maps.Marker({
          map: map,
          position: new naver.maps.LatLng(pin.latitude, pin.longitude),
          icon: { content: element, anchor: new naver.maps.Point(${PHOTO_PIN_ANCHOR.x}, ${PHOTO_PIN_ANCHOR.y}) },
          zIndex: 50,
        });
        naver.maps.Event.addListener(marker, 'click', function () {
          post({ type: 'photoPinPress', id: pin.id });
        });
        return marker;
      });
    }

    window.__fromApp = function (message) {
      // 인증 실패 시 네이버 SDK 가 naver.maps 를 비우므로 그 뒤 메시지는 무시
      if (!naver.maps) {
        return;
      }
      if (message.type === 'location') {
        updateMyLocation(message);
      } else if (message.type === 'photoPins') {
        updatePhotoPins(message.pins);
      }
    };

    post({ type: 'ready' });
  })();
</script>
</body>
</html>`;
}
