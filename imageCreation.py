def imageCreation(input):

    # input contents array population
    inputContentsArrPush(input.replace(",", " ,"))
    inputContentsArrCurrentIndex = 0
    moveArrCurrentIndex = 0

    # canvas preparation
    canvasWidth, canvasHeight = 400, 37
    canvasSize = (canvasWidth, canvasHeight)
    canvas = Image.new('RGBA', canvasSize)
    # for putting text on the image ("+", etc.)
    draw = ImageDraw.Draw(canvas)

    # these values are adjusted to determine where to put the next image or text used in the completed image
    nextWidth = nextHeight = 0

    # function for determining how many pixels away to place the next image element, depending on what the current and next ones are
    def incWidth(stateFrom, stateTo, dirOrMotionNum):
        addend = 0

        if (stateFrom == "direction" and stateTo == "plus"):
            if (dirOrMotionNum == "1" or dirOrMotionNum == "2" or dirOrMotionNum == "4" or dirOrMotionNum == "5" or dirOrMotionNum == "7" or dirOrMotionNum == "8"):
                addend = 36
            elif (dirOrMotionNum == "3" or dirOrMotionNum == "9"):
                addend = 37
            elif (dirOrMotionNum == "6"):
                addend = 41

            # print("before \"direction\" -> \"plus\": " + str(nextWidth))
            # print("after \"direction\" -> \"plus\": " + str(nextWidth+addend))
            # print("")
        elif (stateFrom == "motion" and stateTo == "plus"):
            if (dirOrMotionNum == "236"):
                addend = 41
            else:
                addend = 36

            # print("before \"motion\" -> \"plus\": " + str(nextWidth))
            # print("after \"motion\" -> \"plus\": " + str(nextWidth+addend))
            # print("")
        elif (stateFrom == "plus" and stateTo == "button"):
            addend = 18

            # print("before \"plus\" -> \"button\": " + str(nextWidth))
            # print("after \"plus\" -> \"button\": " + str(nextWidth+addend))
            # print("")
        elif (stateFrom == "button" and stateTo == ">"):
            addend = 32

            # print("before \"button\" -> \">\": " + str(nextWidth))
            # print("after \"button\" -> \">\": " + str(nextWidth+addend))
            # print("")
        elif (stateFrom == ">" and stateTo == "button"):
            addend = 12

            # print("before \">\" -> \"button\": " + str(nextWidth))
            # print("after \">\" -> \"button\": " + str(nextWidth+addend))
            # print("")
        elif (stateFrom == ">" and stateTo == "motion"):
            if (dirOrMotionNum == "236"):
                addend = 12
            elif (dirOrMotionNum == "214"):
                addend = 17
            else:
                addend = 120

            # print("before \">\" -> \"motion\": " + str(nextWidth))
            # print("after \">\" -> \"motion\": " + str(nextWidth+addend))
            # print("")

        return(addend)

    def drawPlus(w,h):
        draw.text((w,h), "+", font=ImageFont.truetype("FreeSans.ttf", 24), fill=(255,255,255,255), stroke_width=2, stroke_fill=(0,0,0,255))

    def drawComma(w,h):
        draw.text((w,h), ",", font=ImageFont.truetype("FreeSans.ttf", 18), fill=(255,255,255,255), stroke_width=2, stroke_fill=(0,0,0,255))

    def drawArrow(w,h):
        draw.text((w,h), ">", font=ImageFont.truetype("FreeSans.ttf", 18), fill=(255,255,255,255), stroke_width=2, stroke_fill=(0,0,0,255))

    def drawxx(w,h):
        draw.text((w,h), "xx", font=ImageFont.truetype("FreeSans.ttf", 18), fill=(255,255,255,255), stroke_width=2, stroke_fill=(0,0,0,255))

    # automated image assembly using other functions for info
    for move in input.split(" "):
        nextMove = getNextMove()
        currentMoveType = parseMoveType(move)
        nextMoveType = parseMoveType(nextMove)

        print("\"" + move + "\"")
        print("return data: " + str(moveTranslation(move)))
        print("move is: " + currentMoveType)
        print(" ")


        if (currentMoveType == None):
            pass
        elif (currentMoveType == "button"):
            # if neutral...no direction?
            # different width spacing depending on direction before text...arrow can get in way
            dirNum = moveTranslation(move)[0].lower()
            btn = moveTranslation(move)[1].lower()
            numOfHits = moveTranslation(move)[2]

            dirAbv = notation["directions"][dir]["abbreviation"]
            dirImg = Image.open(f"./images/directions/{dirAbv}.png")
            btnImg = Image.open(f"./images/buttons/{btn}.png")

            canvas.paste(dirImg, (nextWidth, nextHeight))
            nextWidth += incWidth("direction", "plus", dirNum)
            drawPlus(nextWidth, 5)
            nextWidth += incWidth("plus", "button", 0)
            canvas.paste(btnImg, (nextWidth, 7))

            nextWidth += incWidth("button", nextMoveType, 0)
            inputContentsArrCurrentIndex += 1
            moveArrCurrentIndex += 1
        elif (currentMoveType == "motion"):
            motionNum = moveTranslation(move)[0].lower()
            btn = moveTranslation(move)[1].lower()

            motionAbv = notation["motions"][motionNum]["abbreviation"]
            motionImg = Image.open(f"./images/motions/{motionAbv}.png")
            btnImg = Image.open(f"./images/buttons/{btn}.png")

            canvas.paste(motionImg, (nextWidth, nextHeight))
            nextWidth += incWidth("motion", "plus", motionNum)
            drawPlus(nextWidth, 5)
            nextWidth += incWidth("plus", "button", 0)
            canvas.paste(btnImg, (nextWidth, 7))

            nextWidth += incWidth("button", nextMoveType, 0)
            inputContentsArrCurrentIndex += 1
            moveArrCurrentIndex += 1
        elif (currentMoveType == "charge"):
            pass
        elif (currentMoveType == ">"):
            drawArrow(nextWidth,7)
            # print(f"before \">\" -> \"{nextMoveType}\": " + str(nextWidth))

            if (nextMoveType == "motion"):
                motionNum = moveTranslation(nextMove)[0].lower()
                nextWidth += incWidth(">", nextMoveType, str(motionNum))
                pass
            else:
                nextWidth += incWidth(">", nextMoveType, 0)
                pass

            # print(f"after \">\" -> \"{nextMoveType}\": " + str(nextWidth))
            # print("")
            inputContentsArrCurrentIndex += 1
            moveArrCurrentIndex += 1

        elif (currentMoveType == ","):
            pass
        elif (currentMoveType == "xx"):
            pass

        canvas.save("./move.png", "PNG")
