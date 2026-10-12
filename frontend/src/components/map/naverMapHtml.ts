// WebView 안에서 실행되는 지도 페이지 (네이버 지도 JavaScript API v3)
// 앱 → 지도: window.__fromApp({ type: 'location', ... }) 를 injectJavaScript 로 호출
// 지도 → 앱: window.ReactNativeWebView.postMessage(JSON 문자열)

export type MapCamera = { latitude: number; longitude: number; zoom: number };

export function buildNaverMapHtml(clientId: string, camera: MapCamera) {
  const scriptUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
  /* 길게 눌렀을 때 텍스트 선택·복사 메뉴가 뜨지 않도록 */
  body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  .me { width: 14px; height: 14px; border-radius: 50%; background: #2F80ED; border: 3px solid #fff; box-shadow: 0 0 4px rgba(0, 0, 0, 0.35); }
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
          fillColor: '#2F80ED',
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

    window.__fromApp = function (message) {
      if (message.type === 'location') {
        updateMyLocation(message);
      }
    };

    post({ type: 'ready' });
  })();
</script>
</body>
</html>`;
}
