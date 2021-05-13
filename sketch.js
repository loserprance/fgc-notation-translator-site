let imagesURLprepend = "https://raw.githubusercontent.com/loserprance/fgc-notation-translator-site/master/images/"
function preload() {
  btnDim = 25
  dirDim = 37
  threeBtnDim = [60, 25]

  btnLP = loadImage(`${imagesURLprepend}buttons/lp.png`);
  btnLK = loadImage(`${imagesURLprepend}buttons/lk.png`);
  btnMP = loadImage(`${imagesURLprepend}buttons/mp.png`);
  btnMK = loadImage(`${imagesURLprepend}buttons/mk.png`);
  btnHP = loadImage(`${imagesURLprepend}buttons/hp.png`);
  btnHK = loadImage(`${imagesURLprepend}buttons/hk.png`);
  btnPPP = loadImage(`${imagesURLprepend}buttons/3p.png`);
  btnKKK = loadImage(`${imagesURLprepend}buttons/3k.png`);

  dir1 = loadImage(`${imagesURLprepend}directions/db.png`);
  dir2 = loadImage(`${imagesURLprepend}directions/d.png`);
  dir3 = loadImage(`${imagesURLprepend}directions/df.png`);
  dir4 = loadImage(`${imagesURLprepend}directions/b.png`);
  dir5 = loadImage(`${imagesURLprepend}directions/n.png`);
  dir6 = loadImage(`${imagesURLprepend}directions/f.png`);
  dir7 = loadImage(`${imagesURLprepend}directions/ub.png`);
  dir8 = loadImage(`${imagesURLprepend}directions/u.png`);
  dir9 = loadImage(`${imagesURLprepend}directions/uf.png`);

  mtn360 = loadImage(`${imagesURLprepend}motions/360.png`);
  mtnBDBD = loadImage(`${imagesURLprepend}motions/bdbd.png`);
  mtnDP = loadImage(`${imagesURLprepend}motions/dp.png`);
  mtnFDFD = loadImage(`${imagesURLprepend}motions/fdfd.png`);
  mtnHCB = loadImage(`${imagesURLprepend}motions/hcb.png`);
  mtnHCF = loadImage(`${imagesURLprepend}motions/hcf.png`);
  mtnQCB = loadImage(`${imagesURLprepend}motions/qcb.png`);
  mtnQCF = loadImage(`${imagesURLprepend}motions/qcf.png`);
  mtnRDP = loadImage(`${imagesURLprepend}motions/rdp.png`);
  mtnTK = loadImage(`${imagesURLprepend}motions/tk.png`);
}

function setup() {

  header = createElement('h2', 'Enter your combo')
  header.position(20,0)

  input = createInput()
  input.size(500)
  input.position(20,60)
  input.input(parseInputToImg)
 
  // button = createButton('submit')
  // button.position(input.x + input.width, 61);
  // button.mousePressed(parseInputToImg);

  canvas = createCanvas(510, 200);
  canvas.position(20, 100)
  noLoop()
}

function parseInputToImg() {
  let textSizeValue = 18
  textSize(textSizeValue)
  fill(255)
  stroke(0)
  strokeWeight(4)
  smooth()
  textAlign(LEFT)
  clear()
  // background(155)

  inputValue = input.value()
  text(inputValue, 3, 3, canvas.size()["width"], canvas.size()["height"])

}
